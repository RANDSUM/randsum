#!/usr/bin/env bun

/**
 * Enhance TypeDoc documentation with:
 * - Package organization (Core Packages vs Game Systems)
 * - Game system links to their respective tables
 * - Better syntax highlighting
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { extname, join } from 'path';

const DOCS_DIR = join(import.meta.dir, '..', 'docs', 'api', 'generated');

// Game system information with links to their tables/documentation
const GAME_SYSTEMS = {
  '5e': {
    name: 'D&D 5th Edition',
    link: 'https://www.dndbeyond.com/sources/basic-rules',
    description: 'Dungeons & Dragons 5th Edition support'
  },
  'blades': {
    name: 'Blades in the Dark',
    link: 'https://bladesinthedark.com/',
    description: 'Blades in the Dark RPG system'
  },
  'daggerheart': {
    name: 'Daggerheart',
    link: 'https://darringtonpress.com/daggerheart/',
    description: 'Daggerheart RPG by Darrington Press'
  },
  'root-rpg': {
    name: 'Root RPG',
    link: 'https://www.magpiegames.com/pages/root-rpg',
    description: 'Root: The Tabletop Roleplaying Game'
  },
  'salvageunion': {
    name: 'Salvage Union',
    link: 'https://www.leyline.press/salvage-union',
    description: 'Salvage Union mech RPG'
  }
};

const CORE_PACKAGES = {
  'core': 'Shared utilities and types',
  'dice': 'Core dice rolling implementation',
  'notation': 'Dice notation parser'
};

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

function createGameSystemLink(systemKey: string): string {
  const system = GAME_SYSTEMS[systemKey as keyof typeof GAME_SYSTEMS];
  if (!system) return '';

  return `<a href="${system.link}" class="game-system-link" target="_blank" rel="noopener noreferrer" title="${system.description}">${system.name}</a>`;
}

function organizePackagesIntoSections(content: string): string {
  // Find all module entries in the content
  const modulePattern = /<dt class="tsd-member-summary">.*?<\/dd>/gs;
  const modules = content.match(modulePattern) || [];

  if (modules.length === 0) {
    console.log('No modules found to organize');
    return content;
  }

  const coreModules: string[] = [];
  const gameSystemModules: string[] = [];

  modules.forEach(module => {
    // Check if this is a core package by looking for the actual module paths
    const isCore = Object.keys(CORE_PACKAGES).some(pkg =>
      module.includes(`modules/packages_${pkg}_src.html`) ||
      module.includes(`>packages/${pkg}/src<`) ||
      module.includes(`packages_${pkg}_src`)
    );

    // Debug logging
    if (module.includes('packages/')) {
      console.log(`Checking module: ${module.substring(0, 200)}...`);
      console.log(`Is core: ${isCore}`);
    }

    if (isCore) {
      // Add friendly name for core packages
      let enhancedModule = module;
      Object.keys(CORE_PACKAGES).forEach(pkg => {
        if (module.includes(`packages_${pkg}_src`)) {
          enhancedModule = enhancedModule.replace(
            /packages\/[^\/]+\/src/g,
            `@randsum/${pkg}`
          ).replace(
            /packages_[^_]+_src/g,
            `@randsum/${pkg}`
          );
        }
      });
      coreModules.push(enhancedModule);
    } else {
      // Add game system links to game system modules
      let enhancedModule = module;
      Object.keys(GAME_SYSTEMS).forEach(systemKey => {
        if (module.includes(`modules/gamePackages_${systemKey}_src.html`) ||
          module.includes(`gamePackages/${systemKey}/src`) ||
          module.includes(`gamePackages_${systemKey}_src`)) {
          const link = createGameSystemLink(systemKey);
          // Insert the link before the closing </dt> tag
          enhancedModule = enhancedModule.replace(
            /(<\/dt>)/,
            `${link}$1`
          );
          // Also update the display name
          enhancedModule = enhancedModule.replace(
            /gamePackages\/[^\/]+\/src/g,
            `@randsum/${systemKey}`
          ).replace(
            /gamePackages_[^_]+_src/g,
            `@randsum/${systemKey}`
          );
        }
      });
      gameSystemModules.push(enhancedModule);
    }
  });

  console.log(`Found ${coreModules.length} core modules and ${gameSystemModules.length} game system modules`);

  // Create organized sections
  const coreSection = `
    <details class="tsd-panel-group tsd-member-group tsd-accordion" open>
      <summary class="tsd-accordion-summary" data-key="section-CorePackages">
        <h2><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><use href="../assets/icons.svg#icon-chevronDown"></use></svg> Core Packages</h2>
      </summary>
      <div class="tsd-accordion-details">
        <dl class="tsd-member-summaries">
          ${coreModules.join('\n          ')}
        </dl>
      </div>
    </details>
  `;

  const gameSystemsSection = `
    <details class="tsd-panel-group tsd-member-group tsd-accordion" open>
      <summary class="tsd-accordion-summary" data-key="section-GameSystems">
        <h2><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><use href="../assets/icons.svg#icon-chevronDown"></use></svg> Game Systems</h2>
      </summary>
      <div class="tsd-accordion-details">
        <dl class="tsd-member-summaries">
          ${gameSystemModules.join('\n          ')}
        </dl>
      </div>
    </details>
  `;

  // Find and replace the original modules section
  const originalSectionPattern = /<details class="tsd-panel-group tsd-member-group tsd-accordion"[^>]*>.*?<\/details>/s;
  const match = content.match(originalSectionPattern);

  if (match) {
    return content.replace(originalSectionPattern, coreSection + gameSystemsSection);
  } else {
    console.log('Could not find original modules section to replace');
    return content;
  }
}

function enhanceSyntaxHighlighting(content: string): string {
  // Add language classes to code blocks for better highlighting
  let enhanced = content.replace(
    /<pre><code>/g,
    '<pre><code class="language-typescript">'
  );

  // Enhance inline code elements
  enhanced = enhanced.replace(
    /<code>([^<]+)<\/code>/g,
    '<code class="language-typescript">$1</code>'
  );

  return enhanced;
}

async function enhanceHtmlFile(filePath: string): Promise<boolean> {
  try {
    let content = await readFile(filePath, 'utf-8');

    // Only enhance the main index file for package organization
    if (filePath.endsWith('index.html')) {
      content = organizePackagesIntoSections(content);
    }

    // Enhance syntax highlighting for all files
    content = enhanceSyntaxHighlighting(content);

    await writeFile(filePath, content, 'utf-8');
    console.log(`✓ Enhanced: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`✗ Error enhancing ${filePath}:`, error);
    return false;
  }
}

async function main(): Promise<void> {
  console.log('🎨 Enhancing TypeDoc documentation...');

  // Find all HTML files
  const htmlFiles = await findHtmlFiles(DOCS_DIR);
  console.log(`📄 Found ${htmlFiles.length} HTML files to enhance`);

  if (htmlFiles.length === 0) {
    console.warn('⚠ No HTML files found. Make sure TypeDoc has generated documentation first.');
    process.exit(1);
  }

  // Process each HTML file
  let enhancedCount = 0;
  for (const file of htmlFiles) {
    const wasEnhanced = await enhanceHtmlFile(file);
    if (wasEnhanced) {
      enhancedCount++;
    }
  }

  console.log(`\n🎉 Documentation enhancement complete!`);
  console.log(`📊 Enhanced ${enhancedCount} files`);
  console.log(`🎨 Added syntax highlighting and package organization`);
  console.log(`🔗 Added game system links to external documentation`);
}

// Run the script
main().catch((error) => {
  console.error('💥 Enhancement script failed:', error);
  process.exit(1);
});
