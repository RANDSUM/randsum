#!/usr/bin/env bun

/**
 * Inject dark theme JavaScript into generated TypeDoc HTML files
 * This script modifies all HTML files to include the dark theme override
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const DOCS_DIR = join(import.meta.dir, '..', 'docs', 'api', 'generated');
const DARK_THEME_SCRIPT = `<script src="assets/force-dark-theme.js"></script>`;

async function findHtmlFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await findHtmlFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && extname(entry.name) === '.html') {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

async function injectDarkThemeScript(filePath: string): Promise<boolean> {
  try {
    let content = await readFile(filePath, 'utf-8');
    
    // Check if the script is already injected
    if (content.includes('force-dark-theme.js')) {
      console.log(`✓ Dark theme script already present in: ${filePath}`);
      return false;
    }
    
    // Find the closing </head> tag and inject our script before it
    const headCloseIndex = content.indexOf('</head>');
    if (headCloseIndex === -1) {
      console.warn(`⚠ No </head> tag found in: ${filePath}`);
      return false;
    }
    
    // Insert the script tag before </head>
    const beforeHead = content.substring(0, headCloseIndex);
    const afterHead = content.substring(headCloseIndex);
    const newContent = beforeHead + DARK_THEME_SCRIPT + afterHead;
    
    // Also modify the initial theme script to force dark theme
    const modifiedContent = newContent.replace(
      /document\.documentElement\.dataset\.theme = localStorage\.getItem\("tsd-theme"\) \|\| "os";/g,
      'document.documentElement.dataset.theme = "dark"; localStorage.setItem("tsd-theme", "dark");'
    );
    
    await writeFile(filePath, modifiedContent, 'utf-8');
    console.log(`✓ Injected dark theme script into: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error);
    return false;
  }
}

async function copyDarkThemeAssets(): Promise<void> {
  try {
    // Copy the JavaScript file to assets directory
    const jsSource = join(import.meta.dir, '..', 'docs', 'force-dark-theme.js');
    const jsTarget = join(DOCS_DIR, 'assets', 'force-dark-theme.js');
    
    const jsContent = await readFile(jsSource, 'utf-8');
    await writeFile(jsTarget, jsContent, 'utf-8');
    console.log('✓ Copied force-dark-theme.js to assets directory');
  } catch (error) {
    console.error('✗ Error copying dark theme assets:', error);
  }
}

async function main(): Promise<void> {
  console.log('🌙 Injecting dark theme into TypeDoc documentation...');
  
  // First, copy the dark theme assets
  await copyDarkThemeAssets();
  
  // Find all HTML files
  const htmlFiles = await findHtmlFiles(DOCS_DIR);
  console.log(`📄 Found ${htmlFiles.length} HTML files to process`);
  
  if (htmlFiles.length === 0) {
    console.warn('⚠ No HTML files found. Make sure TypeDoc has generated documentation first.');
    process.exit(1);
  }
  
  // Process each HTML file
  let processedCount = 0;
  for (const file of htmlFiles) {
    const wasModified = await injectDarkThemeScript(file);
    if (wasModified) {
      processedCount++;
    }
  }
  
  console.log(`\n🎉 Dark theme injection complete!`);
  console.log(`📊 Processed ${processedCount} files`);
  console.log(`🌙 Documentation will now default to dark theme`);
}

// Run the script
main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
