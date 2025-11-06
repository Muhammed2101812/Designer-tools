#!/usr/bin/env tsx

/**
 * Production Database Migration Script
 * 
 * This script helps run database migrations in production Supabase project.
 * It provides guidance and validation for safe migration execution.
 */

import { createClient } from '@supabase/supabase-js'
import chalk from 'chalk'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

interface MigrationFile {
  filename: string
  path: string
  content: string
  order: number
}

class ProductionMigrationRunner {
  private supabase: any
  private migrations: MigrationFile[] = []

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      this.log('❌ Missing Supabase credentials', 'error')
      this.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY', 'error')
      process.exit(1)
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey)
  }

  private log(message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warn: chalk.yellow,
      error: chalk.red,
    }
    console.log(colors[type](message))
  }

  private loadMigrations() {
    this.log('\n📁 Loading Migration Files...', 'info')

    const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
    
    try {
      const files = readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort()

      this.migrations = files.map(filename => {
        const path = join(migrationsDir, filename)
        const content = readFileSync(path, 'utf-8')
        const order = parseInt(filename.split('_')[0]) || 0

        return {
          filename,
          path,
          content,
          order
        }
      })

      this.log(`Found ${this.migrations.length} migration files:`, 'success')
      this.migrations.forEach(migration => {
        this.log(`  • ${migration.filename}`, 'info')
      })

    } catch (error) {
      this.log('❌ Failed to load migrations', 'error')
      this.log('Make sure supabase/migrations/ directory exists', 'error')
      process.exit(1)
    }
  }

  private async checkDatabaseConnection() {
    this.log('\n🔌 Testing Database Connection...', 'info')

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1)

      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected for fresh DB)
        throw error
      }

      this.log('✅ Database connection successful', 'success')
      return true
    } catch (error) {
      this.log('❌ Database connection failed', 'error')
      this.log(`Error: ${error}`, 'error')
      return false
    }
  }

  private async checkExistingTables() {
    this.log('\n🗄️ Checking Existing Database Schema...', 'info')

    try {
      // Check if migration tracking table exists
      const { data: tables, error } = await this.supabase
        .rpc('get_table_names')
        .single()

      if (error) {
        this.log('⚠️  Cannot check existing tables (this is normal for fresh databases)', 'warn')
        return []
      }

      const existingTables = tables || []
      
      if (existingTables.length > 0) {
        this.log('Found existing tables:', 'info')
        existingTables.forEach((table: string) => {
          this.log(`  • ${table}`, 'info')
        })
      } else {
        this.log('No existing tables found (fresh database)', 'info')
      }

      return existingTables
    } catch (error) {
      this.log('⚠️  Could not check existing tables', 'warn')
      return []
    }
  }

  private async createMigrationTrackingTable() {
    this.log('\n📋 Setting up Migration Tracking...', 'info')

    const createTrackingTableSQL = `
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum TEXT
      );
    `

    try {
      const { error } = await this.supabase.rpc('exec_sql', { 
        sql: createTrackingTableSQL 
      })

      if (error) throw error

      this.log('✅ Migration tracking table ready', 'success')
    } catch (error) {
      this.log('❌ Failed to create migration tracking table', 'error')
      this.log(`Error: ${error}`, 'error')
      throw error
    }
  }

  private async getExecutedMigrations(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('_migrations')
        .select('filename')

      if (error) throw error

      return data?.map(row => row.filename) || []
    } catch (error) {
      this.log('⚠️  Could not fetch executed migrations', 'warn')
      return []
    }
  }

  private async executeMigration(migration: MigrationFile): Promise<boolean> {
    this.log(`\n🔄 Executing: ${migration.filename}`, 'info')

    try {
      // Execute the migration SQL
      const { error: execError } = await this.supabase.rpc('exec_sql', {
        sql: migration.content
      })

      if (execError) throw execError

      // Record the migration as executed
      const { error: recordError } = await this.supabase
        .from('_migrations')
        .insert({
          filename: migration.filename,
          checksum: this.generateChecksum(migration.content)
        })

      if (recordError) throw recordError

      this.log(`✅ Successfully executed: ${migration.filename}`, 'success')
      return true
    } catch (error) {
      this.log(`❌ Failed to execute: ${migration.filename}`, 'error')
      this.log(`Error: ${error}`, 'error')
      return false
    }
  }

  private generateChecksum(content: string): string {
    // Simple checksum for migration content
    return Buffer.from(content).toString('base64').slice(0, 32)
  }

  private async runMigrations() {
    this.log('\n🚀 Running Database Migrations...', 'info')

    const executedMigrations = await this.getExecutedMigrations()
    const pendingMigrations = this.migrations.filter(
      migration => !executedMigrations.includes(migration.filename)
    )

    if (pendingMigrations.length === 0) {
      this.log('✅ All migrations are already executed', 'success')
      return true
    }

    this.log(`Found ${pendingMigrations.length} pending migrations:`, 'info')
    pendingMigrations.forEach(migration => {
      this.log(`  • ${migration.filename}`, 'warn')
    })

    // Execute migrations in order
    for (const migration of pendingMigrations) {
      const success = await this.executeMigration(migration)
      if (!success) {
        this.log('❌ Migration execution stopped due to error', 'error')
        return false
      }
    }

    this.log('\n✅ All migrations executed successfully!', 'success')
    return true
  }

  private printPreMigrationChecklist() {
    this.log('\n📋 Pre-Migration Checklist', 'info')
    this.log('=' .repeat(50), 'info')
    this.log('Before running migrations, ensure:', 'info')
    this.log('  ☐ You have a database backup', 'warn')
    this.log('  ☐ You are connected to the correct Supabase project', 'warn')
    this.log('  ☐ You have tested migrations in a staging environment', 'warn')
    this.log('  ☐ You have the SUPABASE_SERVICE_ROLE_KEY', 'warn')
    this.log('  ☐ No other deployments are running', 'warn')
    this.log('\n⚠️  Migrations will modify your production database!', 'error')
  }

  private async confirmExecution(): Promise<boolean> {
    // In a real implementation, you might want to add interactive confirmation
    // For now, we'll just check if we're in the right environment
    
    const isProduction = process.env.NODE_ENV === 'production'
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!isProduction) {
      this.log('⚠️  NODE_ENV is not set to production', 'warn')
    }

    if (supabaseUrl?.includes('localhost')) {
      this.log('❌ Cannot run production migrations against localhost', 'error')
      return false
    }

    this.log('\n✅ Environment checks passed', 'success')
    return true
  }

  async run() {
    this.log('🗄️ Design Kit Production Migration Runner', 'info')
    this.log('=' .repeat(60), 'info')

    this.printPreMigrationChecklist()

    const confirmed = await this.confirmExecution()
    if (!confirmed) {
      this.log('❌ Migration cancelled', 'error')
      process.exit(1)
    }

    this.loadMigrations()

    const connected = await this.checkDatabaseConnection()
    if (!connected) {
      process.exit(1)
    }

    await this.checkExistingTables()
    await this.createMigrationTrackingTable()

    const success = await this.runMigrations()
    
    if (success) {
      this.log('\n🎉 Production migrations completed successfully!', 'success')
      this.log('Next steps:', 'info')
      this.log('  1. Verify your application works correctly', 'info')
      this.log('  2. Run post-deployment tests', 'info')
      this.log('  3. Monitor for any errors', 'info')
    } else {
      this.log('\n❌ Migration failed', 'error')
      this.log('Please check the errors above and fix before retrying', 'error')
      process.exit(1)
    }
  }
}

// Run the migration runner
if (require.main === module) {
  const runner = new ProductionMigrationRunner()
  runner.run().catch(console.error)
}

export { ProductionMigrationRunner }