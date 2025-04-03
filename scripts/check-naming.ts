#!/usr/bin/env bun

/**
 * Script to check for consistent naming conventions across the codebase
 * Run with: bun run scripts/check-naming.ts
 */

import { readdirSync, statSync, readFileSync } from 'fs'
import { join, extname } from 'path'

// Patterns to check
const patterns = {
  // Class names should be PascalCase
  classPattern: /class\s+([a-z][A-Za-z0-9]*)/g,
  // Interface names should start with I and be PascalCase
  interfacePattern: /interface\s+(?!I[A-Z])[A-Za-z0-9]+/g,
  // Enum names should be PascalCase
  enumPattern: /enum\s+([a-z][A-Za-z0-9]*)/g,
  // Function names should be camelCase
  functionPattern: /function\s+([A-Z][A-Za-z0-9]*)/g,
  // Variable names should be camelCase
  constPattern: /const\s+([A-Z][A-Za-z0-9]*)\s*(?::|=)/g,
  letPattern: /let\s+([A-Z][A-Za-z0-9]*)\s*(?::|=)/g,
}

// File extensions to check
const extensions = ['.ts', '.tsx']

// Directories to exclude
const excludeDirs = ['node_modules', 'dist', 'coverage', '.git']

// Function to recursively find all TypeScript files
function findFiles(dir: string): string[] {
  const files: string[] = []
  
  try {
    const entries = readdirSync(dir)
    
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      
      if (excludeDirs.includes(entry)) {
        continue
      }
      
      try {
        const stat = statSync(fullPath)
        
        if (stat.isDirectory()) {
          files.push(...findFiles(fullPath))
        } else if (extensions.includes(extname(fullPath))) {
          files.push(fullPath)
        }
      } catch (err) {
        console.error(`Error accessing ${fullPath}:`, err)
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err)
  }
  
  return files
}

// Function to check a file for naming convention issues
function checkFile(filePath: string): { file: string; issues: string[] } {
  const issues: string[] = []
  
  try {
    const content = readFileSync(filePath, 'utf8')
    let match
    
    // Check for class naming issues
    while ((match = patterns.classPattern.exec(content)) !== null) {
      issues.push(`Class name should be PascalCase: ${match[1]}`)
    }
    
    // Check for interface naming issues
    while ((match = patterns.interfacePattern.exec(content)) !== null) {
      issues.push(`Interface name should start with I and be PascalCase: ${match[0].split(' ')[1]}`)
    }
    
    // Check for enum naming issues
    while ((match = patterns.enumPattern.exec(content)) !== null) {
      issues.push(`Enum name should be PascalCase: ${match[1]}`)
    }
    
    // Check for function naming issues
    while ((match = patterns.functionPattern.exec(content)) !== null) {
      issues.push(`Function name should be camelCase: ${match[1]}`)
    }
    
    // Check for variable naming issues
    while ((match = patterns.constPattern.exec(content)) !== null) {
      // Ignore constants (all uppercase with underscores)
      if (!/^[A-Z][A-Z0-9_]*$/.test(match[1])) {
        issues.push(`Constant name should be camelCase: ${match[1]}`)
      }
    }
    
    while ((match = patterns.letPattern.exec(content)) !== null) {
      issues.push(`Variable name should be camelCase: ${match[1]}`)
    }
  } catch (err) {
    issues.push(`Error reading file: ${err}`)
  }
  
  return { file: filePath, issues }
}

// Main function
async function main(): Promise<void> {
  console.log('Checking naming conventions...')
  
  const files = findFiles('packages')
  console.log(`Found ${files.length} TypeScript files to check`)
  
  let totalIssues = 0
  
  for (const file of files) {
    const result = checkFile(file)
    
    if (result.issues.length > 0) {
      console.log(`\nIssues in ${result.file}:`)
      result.issues.forEach((issue) => console.log(`- ${issue}`))
      totalIssues += result.issues.length
    }
  }
  
  if (totalIssues > 0) {
    console.log(`\nFound ${totalIssues} naming convention issues`)
    process.exit(1)
  } else {
    console.log('\nNo naming convention issues found!')
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
