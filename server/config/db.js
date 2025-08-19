// server/config/db.js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

console.log('🔐 Supabase URL:', process.env.SUPABASE_URL)
console.log('🔐 Supabase KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Loaded ✅' : 'Missing ❌')

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('❌ Supabase URL or Key missing in .env file')
}

module.exports = supabase
