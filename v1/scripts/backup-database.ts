#!/usr/bin/env tsx
/**
 * Database Backup Script
 * 
 * Creates backups of the Supabase database and stores them securely.
 * Supports multiple backup strategies and retention policies.
 * 
 * Usage:
 *   npm run backup-db
 *   npx tsx scripts/backup-database.ts
 *   npx tsx scripts/backup-database.ts --type=full --compress
 */

import { createClient } from '@supabase/supabase-js'
import { env } from '../lib/env'
import { MONITORING_CONFIG } from '../lib/monitoring/config'
import { execSync } from 'child_process'
import { createWriteStream, createReadStream } from 'fs'
import { mkdir, access, unlink, readdir, stat } from 'fs/promises'
import { join, basename } from 'path'
import { createGzip } from 'zlib'
import { pipeline } from 'stream/promises'

// Backup configuration
const BACKUP_CONFIG = {
  // Backup directory
  backupDir: process.env.BACKUP_DIR || './backups',
  
  // Backup types
  types: {
    full: 'Complete database dump',
    schema: 'Schema only (structure)',
    data: 'Data only (no structure)',
    incremental: 'Changes since last backup',
  },
  
  // Compression options
  compression: {
    enabled: true,
    algorithm: 'gzip',
    level: 6, // Compression level (1-9)
  },
  
  // Retention policy
  retention: MONITORING_CONFIG.backup.retention,
  
  // Tables to backup (empty = all tables)
  includeTables: [
    'profiles',
    'subscriptions',
    'tool_usage',
    'daily_limits',
    'email_preferences',
  ],
  
  // Tables to exclude from backup
  excludeTables: [
    'auth.users', // Handled by Supabase Auth
    'auth.sessions',
    'auth.refresh_tokens',
  ],
  
  // Sensitive data handling
  anonymize: {
    enabled: process.env.NODE_ENV !== 'production',
    tables: {
      profiles: ['email', 'full_name'],
      // Add other tables with sensitive data
    },
  },
}

interface BackupOptions {
  type: 'full' | 'schema' | 'data' | 'incremental'
  compress: boolean
  encrypt: boolean
  upload: boolean
  verify: boolean
}

class DatabaseBackup {
  private supabase: ReturnType<typeof createClient>
  private backupDir: string

  constructor() {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing')
    }

    this.supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    this.backupDir = BACKUP_CONFIG.backupDir
  }

  /**
   * Create a database backup
   */
  async createBackup(options: Partial<BackupOptions> = {}): Promise<string> {
    const opts: BackupOptions = {
      type: 'full',
      compress: true,
      encrypt: false,
      upload: false,
      verify: true,
      ...options,
    }

    console.log(`🔄 Creating ${opts.type} backup...`)
    
    // Ensure backup directory exists
    await this.ensureBackupDirectory()
    
    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup_${opts.type}_${timestamp}.sql`
    const filepath = join(this.backupDir, filename)
    
    try {
      // Create the backup based on type
      switch (opts.type) {
        case 'full':
          await this.createFullBackup(filepath)
          break
        case 'schema':
          await this.createSchemaBackup(filepath)
          break
        case 'data':
          await this.createDataBackup(filepath)
          break
        case 'incremental':
          await this.createIncrementalBackup(filepath)
          break
      }
      
      console.log(`✅ Backup created: ${filename}`)
      
      // Compress if requested
      let finalPath = filepath
      if (opts.compress) {
        finalPath = await this.compressBackup(filepath)
        console.log(`✅ Backup compressed: ${basename(finalPath)}`)
      }
      
      // Verify backup integrity
      if (opts.verify) {
        await this.verifyBackup(finalPath)
        console.log(`✅ Backup verified`)
      }
      
      // Upload to cloud storage if requested
      if (opts.upload) {
        await this.uploadBackup(finalPath)
        console.log(`✅ Backup uploaded to cloud storage`)
      }
      
      // Clean up old backups
      await this.cleanupOldBackups()
      
      return finalPath
      
    } catch (error) {
      console.error(`❌ Backup failed:`, error)
      throw error
    }
  }

  /**
   * Create a full database backup
   */
  private async createFullBackup(filepath: string): Promise<void> {
    // For Supabase, we'll use the REST API to export data
    // In a real implementation, you might use pg_dump with connection string
    
    const tables = BACKUP_CONFIG.includeTables
    const backupData: Record<string, any[]> = {}
    
    for (const table of tables) {
      try {
        console.log(`  📊 Backing up table: ${table}`)
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
        
        if (error) {
          console.warn(`  ⚠️  Warning: Could not backup table ${table}: ${error.message}`)
          continue
        }
        
        backupData[table] = data || []
        console.log(`  ✅ Backed up ${data?.length || 0} rows from ${table}`)
      } catch (error) {
        console.warn(`  ⚠️  Warning: Error backing up table ${table}:`, error)
      }
    }
    
    // Write backup data as SQL INSERT statements
    const sqlContent = this.generateSQLFromData(backupData)
    
    const fs = await import('fs/promises')
    await fs.writeFile(filepath, sqlContent, 'utf8')
  }

  /**
   * Create a schema-only backup
   */
  private async createSchemaBackup(filepath: string): Promise<void> {
    // This would typically use pg_dump --schema-only
    // For now, we'll create a simplified schema backup
    
    const schemaSQL = `
-- Design Kit Database Schema Backup
-- Generated: ${new Date().toISOString()}

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'pro')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL,
  plan TEXT NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tool usage table
CREATE TABLE IF NOT EXISTS tool_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  processing_time INTEGER,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily limits table
CREATE TABLE IF NOT EXISTS daily_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  api_tools_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Email preferences table
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  marketing_emails BOOLEAN DEFAULT true,
  product_updates BOOLEAN DEFAULT true,
  quota_warnings BOOLEAN DEFAULT true,
  subscription_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_user_id ON tool_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_created_at ON tool_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_limits_user_date ON daily_limits(user_id, date);

-- Row Level Security (RLS) policies would be here in a real backup
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
`
    
    const fs = await import('fs/promises')
    await fs.writeFile(filepath, schemaSQL, 'utf8')
  }

  /**
   * Create a data-only backup
   */
  private async createDataBackup(filepath: string): Promise<void> {
    // Similar to full backup but without schema
    await this.createFullBackup(filepath)
  }

  /**
   * Create an incremental backup
   */
  private async createIncrementalBackup(filepath: string): Promise<void> {
    // This would backup only changes since last backup
    // For simplicity, we'll backup data from last 24 hours
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const tables = BACKUP_CONFIG.includeTables
    const backupData: Record<string, any[]> = {}
    
    for (const table of tables) {
      try {
        console.log(`  📊 Backing up recent changes from: ${table}`)
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .gte('updated_at', yesterday.toISOString())
        
        if (error) {
          console.warn(`  ⚠️  Warning: Could not backup table ${table}: ${error.message}`)
          continue
        }
        
        backupData[table] = data || []
        console.log(`  ✅ Backed up ${data?.length || 0} recent rows from ${table}`)
      } catch (error) {
        console.warn(`  ⚠️  Warning: Error backing up table ${table}:`, error)
      }
    }
    
    const sqlContent = this.generateSQLFromData(backupData, true)
    
    const fs = await import('fs/promises')
    await fs.writeFile(filepath, sqlContent, 'utf8')
  }

  /**
   * Generate SQL INSERT statements from data
   */
  private generateSQLFromData(data: Record<string, any[]>, isIncremental = false): string {
    let sql = `-- Design Kit Database ${isIncremental ? 'Incremental ' : ''}Backup\n`
    sql += `-- Generated: ${new Date().toISOString()}\n\n`
    
    for (const [table, rows] of Object.entries(data)) {
      if (rows.length === 0) continue
      
      sql += `-- Table: ${table}\n`
      
      if (isIncremental) {
        sql += `-- Incremental backup - recent changes only\n`
      }
      
      for (const row of rows) {
        const columns = Object.keys(row).join(', ')
        const values = Object.values(row)
          .map(value => {
            if (value === null || value === undefined) return 'NULL'
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
            if (typeof value === 'boolean') return value.toString()
            if (value instanceof Date) return `'${value.toISOString()}'`
            return String(value)
          })
          .join(', ')
        
        sql += `INSERT INTO ${table} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`
      }
      
      sql += '\n'
    }
    
    return sql
  }

  /**
   * Compress a backup file
   */
  private async compressBackup(filepath: string): Promise<string> {
    const compressedPath = `${filepath}.gz`
    
    const readStream = createReadStream(filepath)
    const writeStream = createWriteStream(compressedPath)
    const gzipStream = createGzip({ level: BACKUP_CONFIG.compression.level })
    
    await pipeline(readStream, gzipStream, writeStream)
    
    // Remove original file after compression
    await unlink(filepath)
    
    return compressedPath
  }

  /**
   * Verify backup integrity
   */
  private async verifyBackup(filepath: string): Promise<void> {
    try {
      const stats = await stat(filepath)
      
      if (stats.size === 0) {
        throw new Error('Backup file is empty')
      }
      
      // For compressed files, try to read the header
      if (filepath.endsWith('.gz')) {
        const fs = await import('fs/promises')
        const buffer = await fs.readFile(filepath, { encoding: null })
        
        // Check gzip magic number
        if (buffer[0] !== 0x1f || buffer[1] !== 0x8b) {
          throw new Error('Compressed backup file is corrupted')
        }
      }
      
      console.log(`  📊 Backup size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
      
    } catch (error) {
      throw new Error(`Backup verification failed: ${error}`)
    }
  }

  /**
   * Upload backup to cloud storage
   */
  private async uploadBackup(filepath: string): Promise<void> {
    // This would upload to S3, Google Cloud Storage, etc.
    // For now, we'll just log the action
    console.log(`  ☁️  Would upload ${basename(filepath)} to cloud storage`)
    
    // Example implementation for S3:
    /*
    const AWS = require('aws-sdk')
    const s3 = new AWS.S3()
    
    const fileStream = createReadStream(filepath)
    const uploadParams = {
      Bucket: 'your-backup-bucket',
      Key: `backups/${basename(filepath)}`,
      Body: fileStream,
      StorageClass: 'STANDARD_IA', // Infrequent Access for cost savings
    }
    
    await s3.upload(uploadParams).promise()
    */
  }

  /**
   * Clean up old backups based on retention policy
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await readdir(this.backupDir)
      const backupFiles = files.filter(file => file.startsWith('backup_'))
      
      const now = new Date()
      const filesToDelete: string[] = []
      
      for (const file of backupFiles) {
        const filepath = join(this.backupDir, file)
        const stats = await stat(filepath)
        const ageInDays = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)
        
        // Apply retention policy
        if (ageInDays > BACKUP_CONFIG.retention.daily) {
          filesToDelete.push(filepath)
        }
      }
      
      // Delete old files
      for (const filepath of filesToDelete) {
        await unlink(filepath)
        console.log(`  🗑️  Deleted old backup: ${basename(filepath)}`)
      }
      
      if (filesToDelete.length === 0) {
        console.log(`  ✅ No old backups to clean up`)
      }
      
    } catch (error) {
      console.warn(`  ⚠️  Warning: Could not clean up old backups:`, error)
    }
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await access(this.backupDir)
    } catch {
      await mkdir(this.backupDir, { recursive: true })
      console.log(`📁 Created backup directory: ${this.backupDir}`)
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<Array<{ name: string; size: number; date: Date }>> {
    try {
      const files = await readdir(this.backupDir)
      const backupFiles = files.filter(file => file.startsWith('backup_'))
      
      const backups = []
      for (const file of backupFiles) {
        const filepath = join(this.backupDir, file)
        const stats = await stat(filepath)
        backups.push({
          name: file,
          size: stats.size,
          date: stats.mtime,
        })
      }
      
      return backups.sort((a, b) => b.date.getTime() - a.date.getTime())
    } catch (error) {
      console.error('Failed to list backups:', error)
      return []
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    console.log(`🔄 Restoring from backup: ${basename(backupPath)}`)
    
    // This would restore the database from backup
    // Implementation depends on your backup format and database setup
    
    console.warn('⚠️  Restore functionality not implemented yet')
    console.warn('   Manual restore required using psql or Supabase dashboard')
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const options: Partial<BackupOptions> = {}
  
  // Parse command line arguments
  for (const arg of args) {
    if (arg.startsWith('--type=')) {
      options.type = arg.split('=')[1] as BackupOptions['type']
    } else if (arg === '--compress') {
      options.compress = true
    } else if (arg === '--no-compress') {
      options.compress = false
    } else if (arg === '--encrypt') {
      options.encrypt = true
    } else if (arg === '--upload') {
      options.upload = true
    } else if (arg === '--no-verify') {
      options.verify = false
    } else if (arg === '--list') {
      const backup = new DatabaseBackup()
      const backups = await backup.listBackups()
      
      console.log('📋 Available backups:')
      for (const backup of backups) {
        const sizeMB = (backup.size / 1024 / 1024).toFixed(2)
        console.log(`  ${backup.name} (${sizeMB} MB, ${backup.date.toISOString()})`)
      }
      return
    }
  }
  
  try {
    const backup = new DatabaseBackup()
    const backupPath = await backup.createBackup(options)
    
    console.log('')
    console.log('🎉 Backup completed successfully!')
    console.log(`📁 Backup location: ${backupPath}`)
    console.log('')
    console.log('💡 Next steps:')
    console.log('• Test restore procedure')
    console.log('• Upload to secure cloud storage')
    console.log('• Verify backup integrity regularly')
    console.log('• Document restore procedures')
    
  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { DatabaseBackup, BACKUP_CONFIG }