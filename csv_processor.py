#!/usr/bin/env python3
import pandas as pd
import re
import json
from datetime import datetime
import os
from supabase import create_client, Client

# Supabase 설정
SUPABASE_URL = "https://mtgicixejxtidvskoyqy.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10Z2ljaXhlanh0aWR2c2tveXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1Mzk5MTAsImV4cCI6MjA1MzExNTkxMH0.hQy3fPt-YWYZXOWOAjGlFGNkP2NnmSDUhHvjEHo9BZg"

def normalize_property_type(prop_type):
    """매물종류 정규화"""
    if not prop_type:
        return 'apt'
    
    prop_type = str(prop_type).strip()
    type_map = {
        '아파트': 'apt',
        '오피스텔': 'officetel', 
        '빌라': 'villa',
        '연립': 'villa',
        '빌라/연립': 'villa',
        '단독주택': 'house',
        '상가': 'commercial',
        '사무실': 'commercial',
        '점포': 'commercial'
    }
    return type_map.get(prop_type, 'apt')

def normalize_transaction_type(trans_type):
    """거래유형 정규화"""
    if not trans_type:
        return 'sale'
    
    trans_type = str(trans_type).strip()
    type_map = {
        '매매': 'sale',
        '전세': 'lease', 
        '월세': 'rent',
        '월세/렌트': 'rent',
        '렌트': 'rent'
    }
    return type_map.get(trans_type, 'sale')

def normalize_status(status):
    """매물상태 정규화"""
    if not status:
        return 'available'
    
    status = str(status).strip()
    status_map = {
        '거래가능': 'available',
        '거래중': 'available',
        '판매중': 'available',
        '임대가능': 'available',
        '거래완료': 'completed',
        '계약완료': 'completed', 
        '판매완료': 'completed',
        '임대완료': 'completed',
        '거래보류': 'reserved',
        '보류': 'reserved'
    }
    return status_map.get(status, 'available')

def parse_price(price_text, transaction_type):
    """가격 파싱 및 거래유형별 분리"""
    if not price_text or pd.isna(price_text):
        return {'sale_price': 0, 'lease_deposit': 0, 'monthly_rent': 0}
    
    # 텍스트 정리
    price_text = str(price_text).replace(' ', '').replace(',', '')
    
    # 억, 만원 단위 처리
    def convert_korean_number(text):
        try:
            if '억' in text and '/' in text:
                # "1억/900" 형태 처리
                parts = text.split('/')
                deposit = parts[0].replace('억', '').strip()
                monthly = parts[1].strip()
                
                deposit_amount = float(deposit) * 100000000 if deposit else 0
                monthly_amount = float(monthly) * 10000 if monthly else 0
                
                return (deposit_amount, monthly_amount)
            elif '억' in text:
                amount = text.replace('억', '').replace('원', '').strip()
                return float(amount) * 100000000 if amount else 0
            elif '만' in text:
                amount = text.replace('만', '').replace('원', '').strip()
                return float(amount) * 10000 if amount else 0
            else:
                # 숫자만 있는 경우
                return float(text.replace('원', '')) if text.replace('원', '') else 0
        except:
            return 0
    
    if transaction_type == 'sale':
        # 매매: 단일 가격
        price = convert_korean_number(price_text)
        return {'sale_price': price, 'lease_deposit': 0, 'monthly_rent': 0}
    elif transaction_type == 'lease':
        # 전세: 보증금만
        price = convert_korean_number(price_text)
        return {'sale_price': 0, 'lease_deposit': price, 'monthly_rent': 0}
    elif transaction_type == 'rent':
        # 월세: 보증금/월세 형태
        if '/' in price_text:
            deposit, monthly = convert_korean_number(price_text)
            return {'sale_price': 0, 'lease_deposit': deposit, 'monthly_rent': monthly}
        else:
            # 월세만 있는 경우
            monthly = convert_korean_number(price_text)
            return {'sale_price': 0, 'lease_deposit': 0, 'monthly_rent': monthly}
    
    return {'sale_price': 0, 'lease_deposit': 0, 'monthly_rent': 0}

def parse_area(area_text):
    """면적 파싱"""
    if not area_text:
        return 0, 0
    
    try:
        # "137.46 / 122.97" 형태 처리
        if '/' in area_text:
            parts = area_text.split('/')
            supply = float(parts[0].strip()) if len(parts) > 0 else 0
            private = float(parts[1].strip()) if len(parts) > 1 else 0
            return supply, private
        else:
            area = float(area_text.strip())
            return area, area
    except:
        return 0, 0

def process_csv_data():
    """CSV 데이터 처리"""
    print("CSV 파일 읽는 중...")
    
    # CSV 파일 읽기 (인코딩 문제 해결)
    try:
        df = pd.read_csv('/System/Volumes/Data/Users/hasanghyeon/Downloads/고객연락처_표준화 - 장민아 정이든 장승환.csv', 
                        encoding='utf-8')
    except:
        df = pd.read_csv('/System/Volumes/Data/Users/hasanghyeon/Downloads/고객연락처_표준화 - 장민아 정이든 장승환.csv', 
                        encoding='cp949')
    
    print(f"총 {len(df)} 행의 데이터를 읽었습니다.")
    print("컬럼들:", df.columns.tolist())
    
    # 데이터 정리
    processed_properties = []
    
    for idx, row in df.iterrows():
        try:
            # 필수 필드 확인
            if pd.isna(row.get('매물명')) or pd.isna(row.get('소재지')):
                print(f"행 {idx}: 필수 필드 누락, 건너뜀")
                continue
            
            # 거래유형 정규화
            transaction_type = normalize_transaction_type(row.get('거래유형'))
            
            # 가격 파싱
            price_data = parse_price(row.get('금액'), transaction_type)
            
            # 면적 파싱
            supply_area, private_area = parse_area(row.get('공급/전용(㎡)'))
            
            property_data = {
                'property_name': str(row.get('매물명', '')).strip(),
                'location': str(row.get('소재지', '')).strip(),
                'property_type': normalize_property_type(row.get('매물종류')),
                'transaction_type': transaction_type,
                'property_status': normalize_status(row.get('매물상태')),
                'sale_price': price_data['sale_price'],
                'lease_deposit': price_data['lease_deposit'],
                'monthly_rent': price_data['monthly_rent'],
                'building': str(row.get('동', '')).strip(),
                'unit': str(row.get('호', '')).strip(),
                'supply_area_sqm': supply_area,
                'private_area_sqm': private_area,
                'floor_info': str(row.get('해당층/총층', '')).strip(),
                'rooms_bathrooms': str(row.get('룸/욕실', '')).strip(),
                'direction': str(row.get('방향', '')).strip(),
                'maintenance_fee': str(row.get('관리비', '')).strip(),
                'parking': str(row.get('주차', '')).strip(),
                'move_in_date': str(row.get('입주가능일', '')).strip(),
                'approval_date': str(row.get('사용승인', '')).strip(),
                'special_notes': str(row.get('특이사항', '')).strip(),
                'manager_memo': str(row.get('담당자MEMO', '')).strip(),
                'is_commercial': '상가' in str(row.get('매물종류', '')),
                'manager_id': 'admin-hardcoded'  # 하드코딩된 관리자 ID
            }
            
            processed_properties.append(property_data)
            
        except Exception as e:
            print(f"행 {idx} 처리 중 오류: {e}")
            continue
    
    print(f"총 {len(processed_properties)}개의 매물 데이터를 처리했습니다.")
    return processed_properties

def upload_to_supabase(properties):
    """Supabase에 데이터 업로드"""
    print("Supabase에 연결 중...")
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print(f"{len(properties)}개의 매물을 Supabase에 업로드 중...")
    
    # 배치 단위로 업로드 (한 번에 너무 많이 보내면 오류 발생 가능)
    batch_size = 50
    uploaded_count = 0
    failed_count = 0
    
    for i in range(0, len(properties), batch_size):
        batch = properties[i:i+batch_size]
        
        try:
            result = supabase.table('properties').insert(batch).execute()
            uploaded_count += len(batch)
            print(f"배치 {i//batch_size + 1}: {len(batch)}개 업로드 완료 (총 {uploaded_count}개)")
        except Exception as e:
            print(f"배치 {i//batch_size + 1} 업로드 실패: {e}")
            failed_count += len(batch)
    
    print(f"\n업로드 완료!")
    print(f"성공: {uploaded_count}개")
    print(f"실패: {failed_count}개")
    
    return uploaded_count, failed_count

if __name__ == "__main__":
    try:
        # CSV 데이터 처리
        properties = process_csv_data()
        
        if properties:
            print(f"\n처리된 첫 번째 매물 샘플:")
            print(json.dumps(properties[0], indent=2, ensure_ascii=False))
            
            # JSON 파일로 저장
            print(f"\n{len(properties)}개의 매물을 JSON 파일로 저장합니다...")
            with open('processed_properties.json', 'w', encoding='utf-8') as f:
                json.dump(properties, f, ensure_ascii=False, indent=2)
            print("processed_properties.json 파일로 저장 완료!")
            
            # 업로드는 웹 인터페이스를 통해 진행
            print("웹 인터페이스를 통해 CSV Import 기능을 사용하여 업로드하세요.")
        else:
            print("처리할 매물 데이터가 없습니다.")
            
    except Exception as e:
        print(f"오류 발생: {e}")