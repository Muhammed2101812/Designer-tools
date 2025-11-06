/**
 * Test script to verify Supabase connection and basic queries
 * Run this file to test your Supabase configuration
 * 
 * Usage: node --loader ts-node/esm lib/supabase/test-connection.ts
 * Or create a test API route and call these functions
 */

import { createClient } from './client'
import type { Profile } from './types'

/**
 * Test basic database connection
 */
export async function testConnection() {
  try {
    const supabase = createClient()
    
    // Test connection by querying profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection test failed:', error.message)
      return false
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Connection test error:', error)
    return false
  }
}

/**
 * Test authentication
 */
export async function testAuth() {
  try {
    const supabase = createClient()
    
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Auth test failed:', error.message)
      return false
    }
    
    if (session) {
      console.log('✅ User is authenticated:', session.user.email)
    } else {
      console.log('ℹ️  No active session (user not logged in)')
    }
    
    return true
  } catch (error) {
    console.error('❌ Auth test error:', error)
    return false
  }
}

/**
 * Test profile query
 */
export async function testProfileQuery(userId: string) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('❌ Profile query failed:', error.message)
      return null
    }
    
    console.log('✅ Profile query successful:', data)
    return data as Profile
  } catch (error) {
    console.error('❌ Profile query error:', error)
    return null
  }
}

/**
 * Test database function call
 */
export async function testDatabaseFunction(userId: string) {
  try {
    const supabase = createClient()
    
    // Test can_use_api_tool function
    const { data, error } = await supabase
      .rpc('can_use_api_tool', { p_user_id: userId })
    
    if (error) {
      console.error('❌ Function call failed:', error.message)
      return null
    }
    
    console.log('✅ Function call successful. Can use API tool:', data)
    return data
  } catch (error) {
    console.error('❌ Function call error:', error)
    return null
  }
}

/**
 * Test tool usage insert
 */
export async function testToolUsageInsert(userId: string | null, toolName: string) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('tool_usage')
      .insert({
        user_id: userId,
        tool_name: toolName,
        is_api_tool: false,
        success: true,
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Tool usage insert failed:', error.message)
      return null
    }
    
    console.log('✅ Tool usage insert successful:', data)
    return data
  } catch (error) {
    console.error('❌ Tool usage insert error:', error)
    return null
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🧪 Running Supabase connection tests...\n')
  
  await testConnection()
  await testAuth()
  
  console.log('\n✅ Basic tests completed')
  console.log('ℹ️  To test authenticated queries, log in first and run:')
  console.log('   - testProfileQuery(userId)')
  console.log('   - testDatabaseFunction(userId)')
  console.log('   - testToolUsageInsert(userId, "color-picker")')
}

// Export all test functions
const supabaseTests = {
  testConnection,
  testAuth,
  testProfileQuery,
  testDatabaseFunction,
  testToolUsageInsert,
  runAllTests,
}

export default supabaseTests
