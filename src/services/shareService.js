import googleDriveService from './googleDriveService';
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

class ShareService {
  generateSecureToken() {
    return uuidv4().replace(/-/g, '');
  }

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  async createShareLink(propertyId, options = {}) {
    const shareToken = this.generateSecureToken();
    
    try {
      // 공유용 Google Drive 폴더 생성 (고화질 이미지 포함 시)
      let shareFolderId = null;
      if (options.includeHighQuality) {
        const shareFolder = await googleDriveService.createShareFolder(
          propertyId,
          shareToken
        );
        shareFolderId = shareFolder.id;
        
        // 원본 이미지들을 공유 폴더에 복사
        await this.copyImagesToShareFolder(propertyId, shareFolderId);
      }
      
      const shareData = {
        property_id: propertyId,
        share_token: shareToken,
        share_folder_id: shareFolderId,
        include_high_quality: options.includeHighQuality || false,
        expires_at: options.expiresIn ? this.addDays(new Date(), options.expiresIn) : null,
        view_limit: options.viewLimit || null,
        hide_contact: options.hideContact !== false, // 기본값: 연락처 숨김
        hide_price: options.hidePrice || false,
        hide_owner_info: options.hideOwnerInfo !== false, // 기본값: 소유주 정보 숨김
        custom_message: options.customMessage || null,
        created_by: options.userId,
        view_count: 0
      };
      
      const { data, error } = await supabase
        .from('property_shares')
        .insert(shareData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      const shareUrl = `${window.location.origin}/share/${shareToken}`;
      return { shareUrl, shareData: data };
      
    } catch (error) {
      console.error('Share link creation failed:', error);
      throw error;
    }
  }
  
  async copyImagesToShareFolder(propertyId, shareFolderId) {
    try {
      const { data: images, error } = await supabase
        .from('property_images')
        .select('google_drive_id, original_filename')
        .eq('property_id', propertyId)
        .order('display_order');
      
      if (error) {
        throw error;
      }
      
      for (const image of images) {
        await googleDriveService.copyImageToShareFolder(
          image.google_drive_id,
          shareFolderId
        );
      }
      
      // console.log(`Copied ${images.length} images to share folder`);
      
    } catch (error) {
      console.error('Failed to copy images to share folder:', error);
      throw error;
    }
  }

  async getSharedProperty(shareToken) {
    try {
      // 공유 정보 조회
      const { data: shareData, error: shareError } = await supabase
        .from('property_shares')
        .select(`
          *,
          properties (
            *,
            property_images (*)
          )
        `)
        .eq('share_token', shareToken)
        .single();

      if (shareError) {
        throw shareError;
      }

      if (!shareData) {
        throw new Error('공유 링크를 찾을 수 없습니다.');
      }

      // 만료 확인
      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        throw new Error('공유 링크가 만료되었습니다.');
      }

      // 조회 횟수 제한 확인
      if (shareData.view_limit && shareData.view_count >= shareData.view_limit) {
        throw new Error('공유 링크의 조회 횟수가 초과되었습니다.');
      }

      // 조회 수 증가
      await this.incrementViewCount(shareData.id);

      // 민감한 정보 필터링
      const property = this.filterPropertyData(shareData.properties, shareData);

      return {
        property,
        shareOptions: {
          hide_contact: shareData.hide_contact,
          hide_price: shareData.hide_price,
          hide_owner_info: shareData.hide_owner_info,
          custom_message: shareData.custom_message,
          include_high_quality: shareData.include_high_quality
        }
      };

    } catch (error) {
      console.error('Failed to get shared property:', error);
      throw error;
    }
  }

  filterPropertyData(property, shareOptions) {
    const filteredProperty = { ...property };

    // 연락처 정보 숨기기
    if (shareOptions.hide_contact) {
      delete filteredProperty.manager_phone;
      delete filteredProperty.co_broker_phone;
    }

    // 가격 정보 숨기기
    if (shareOptions.hide_price) {
      delete filteredProperty.price;
      delete filteredProperty.sale_price;
      delete filteredProperty.jeonse_deposit;
      delete filteredProperty.monthly_deposit;
      delete filteredProperty.monthly_rent;
    }

    // 소유주 정보 숨기기 (기본값)
    if (shareOptions.hide_owner_info) {
      delete filteredProperty.owner_name;
      delete filteredProperty.owner_phone;
      delete filteredProperty.owner_id_number;
      delete filteredProperty.contact_relationship;
    }

    return filteredProperty;
  }

  async incrementViewCount(shareId) {
    try {
      const { error } = await supabase
        .from('property_shares')
        .update({ 
          view_count: supabase.raw('view_count + 1'),
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', shareId);

      if (error) {
        // console.warn('Failed to increment view count:', error);
      }

    } catch (error) {
      // console.warn('Failed to increment view count:', error);
    }
  }

  async logShareAccess(shareId, ipAddress, userAgent) {
    try {
      const { error } = await supabase
        .from('share_access_logs')
        .insert({
          share_id: shareId,
          ip_address: ipAddress,
          user_agent: userAgent
        });

      if (error) {
        // console.warn('Failed to log share access:', error);
      }

    } catch (error) {
      // console.warn('Failed to log share access:', error);
    }
  }

  async getPropertyShares(propertyId) {
    try {
      const { data, error } = await supabase
        .from('property_shares')
        .select(`
          *,
          share_access_logs (count)
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Failed to get property shares:', error);
      throw error;
    }
  }

  async deleteShare(shareId) {
    try {
      // 공유 정보 조회
      const { data: shareData, error: selectError } = await supabase
        .from('property_shares')
        .select('share_folder_id')
        .eq('id', shareId)
        .single();

      if (selectError) {
        throw selectError;
      }

      // Google Drive 공유 폴더 삭제 (있는 경우)
      if (shareData.share_folder_id) {
        try {
          await googleDriveService.deleteFile(shareData.share_folder_id);
        } catch (driveError) {
          // console.warn('Failed to delete Google Drive share folder:', driveError);
        }
      }

      // DB에서 공유 정보 삭제
      const { error } = await supabase
        .from('property_shares')
        .delete()
        .eq('id', shareId);

      if (error) {
        throw error;
      }

      return true;

    } catch (error) {
      console.error('Failed to delete share:', error);
      throw error;
    }
  }

  async updateShareOptions(shareId, options) {
    try {
      const updateData = {};

      if (options.hasOwnProperty('expires_at')) {
        updateData.expires_at = options.expires_at;
      }
      if (options.hasOwnProperty('view_limit')) {
        updateData.view_limit = options.view_limit;
      }
      if (options.hasOwnProperty('hide_contact')) {
        updateData.hide_contact = options.hide_contact;
      }
      if (options.hasOwnProperty('hide_price')) {
        updateData.hide_price = options.hide_price;
      }
      if (options.hasOwnProperty('hide_owner_info')) {
        updateData.hide_owner_info = options.hide_owner_info;
      }
      if (options.hasOwnProperty('custom_message')) {
        updateData.custom_message = options.custom_message;
      }

      const { data, error } = await supabase
        .from('property_shares')
        .update(updateData)
        .eq('id', shareId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;

    } catch (error) {
      console.error('Failed to update share options:', error);
      throw error;
    }
  }

  async getShareStatistics(propertyId) {
    try {
      const { data, error } = await supabase
        .from('property_shares')
        .select(`
          id,
          share_token,
          view_count,
          created_at,
          last_viewed_at,
          expires_at
        `)
        .eq('property_id', propertyId);

      if (error) {
        throw error;
      }

      const totalShares = data.length;
      const totalViews = data.reduce((sum, share) => sum + (share.view_count || 0), 0);
      const activeShares = data.filter(share => 
        !share.expires_at || new Date(share.expires_at) > new Date()
      ).length;

      return {
        totalShares,
        totalViews,
        activeShares,
        shares: data
      };

    } catch (error) {
      console.error('Failed to get share statistics:', error);
      throw error;
    }
  }

  buildShareUrl(shareToken) {
    return `${window.location.origin}/share/${shareToken}`;
  }

  getShareOptions() {
    return {
      expirationOptions: [
        { value: 1, label: '1일' },
        { value: 3, label: '3일' },
        { value: 7, label: '1주일' },
        { value: 30, label: '1개월' },
        { value: null, label: '만료 없음' }
      ],
      viewLimitOptions: [
        { value: 10, label: '10회' },
        { value: 50, label: '50회' },
        { value: 100, label: '100회' },
        { value: 500, label: '500회' },
        { value: null, label: '제한 없음' }
      ]
    };
  }
}

export default new ShareService();