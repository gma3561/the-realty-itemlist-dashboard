import '@testing-library/jest-dom'
import { loadEnv } from 'vite'

// Load actual environment variables from .env file
const env = loadEnv('test', process.cwd(), '')
Object.assign(process.env, env)