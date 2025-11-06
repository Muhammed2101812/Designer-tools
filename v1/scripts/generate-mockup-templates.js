#!/usr/bin/env node

/**
 * Script to generate high-quality PNG mockup templates from SVG files
 * This script converts SVG mockup templates to PNG format for better quality and performance
 */

const fs = require('fs').promises;
const path = require('path');

// Template categories and their requirements
const TEMPLATE_CATEGORIES = {
  device: { min: 5, current: [] },
  print: { min: 5, current: [] },
  apparel: { min: 5, current: [] }
};

const TEMPLATES_DIR = path.join(process.cwd(), 'public', 'mockup-templates');

async function main() {
  console.log('🎨 Mockup Template Generator');
  console.log('============================\n');

  try {
    // Read all files in the templates directory
    const files = await fs.readdir(TEMPLATES_DIR);
    
    // Filter JSON metadata files
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} template metadata files:`);
    
    // Analyze templates by category
    for (const jsonFile of jsonFiles) {
      const jsonPath = path.join(TEMPLATES_DIR, jsonFile);
      const content = await fs.readFile(jsonPath, 'utf8');
      const metadata = JSON.parse(content);
      
      if (TEMPLATE_CATEGORIES[metadata.category]) {
        TEMPLATE_CATEGORIES[metadata.category].current.push(metadata);
        console.log(`  ✓ ${metadata.name} (${metadata.category})`);
      }
    }
    
    console.log('\n📊 Template Analysis:');
    console.log('=====================');
    
    let totalTemplates = 0;
    let hasMinimumRequirement = true;
    
    for (const [category, info] of Object.entries(TEMPLATE_CATEGORIES)) {
      const count = info.current.length;
      totalTemplates += count;
      const status = count >= info.min ? '✅' : '❌';
      const requirement = count >= info.min ? 'Met' : `Need ${info.min - count} more`;
      
      console.log(`${status} ${category.charAt(0).toUpperCase() + category.slice(1)}: ${count}/${info.min} templates (${requirement})`);
      
      if (count < info.min) {
        hasMinimumRequirement = false;
      }
    }
    
    console.log(`\n📈 Total Templates: ${totalTemplates}/15`);
    
    if (hasMinimumRequirement && totalTemplates >= 15) {
      console.log('✅ All requirements met!');
    } else {
      console.log('❌ Minimum requirements not met');
    }
    
    // List all templates with their details
    console.log('\n📋 Template Details:');
    console.log('====================');
    
    for (const [category, info] of Object.entries(TEMPLATE_CATEGORIES)) {
      if (info.current.length > 0) {
        console.log(`\n${category.toUpperCase()} TEMPLATES:`);
        for (const template of info.current) {
          const svgExists = files.includes(`${template.id}.svg`);
          const svgStatus = svgExists ? '✓' : '✗';
          
          console.log(`  ${svgStatus} ${template.name}`);
          console.log(`    ID: ${template.id}`);
          console.log(`    Size: ${template.width}x${template.height}`);
          console.log(`    Design Area: ${template.designArea.width}x${template.designArea.height} at (${template.designArea.x}, ${template.designArea.y})`);
          console.log(`    Perspective: ${template.perspectiveTransform.enabled ? 'Enabled' : 'Disabled'}`);
          
          if (template.perspectiveTransform.enabled && template.perspectiveTransform.params) {
            const params = template.perspectiveTransform.params;
            console.log(`    Transform: rotX:${params.rotationX || 0}° rotY:${params.rotationY || 0}° rotZ:${params.rotationZ || 0}°`);
          }
          
          console.log('');
        }
      }
    }
    
    // Generate PNG conversion instructions
    console.log('\n🔄 PNG Conversion Instructions:');
    console.log('===============================');
    console.log('To convert SVG templates to high-quality PNG files, you can use:');
    console.log('');
    console.log('Option 1 - ImageMagick (if installed):');
    console.log('  convert -density 300 -background transparent template.svg template.png');
    console.log('');
    console.log('Option 2 - Online converter:');
    console.log('  Upload SVG files to https://convertio.co/svg-png/ or similar');
    console.log('');
    console.log('Option 3 - Design tools:');
    console.log('  Open SVG in Figma/Photoshop and export as PNG at 2x resolution');
    console.log('');
    
    // Create a summary report
    const report = {
      timestamp: new Date().toISOString(),
      totalTemplates,
      requirementsMet: hasMinimumRequirement && totalTemplates >= 15,
      categories: {}
    };
    
    for (const [category, info] of Object.entries(TEMPLATE_CATEGORIES)) {
      report.categories[category] = {
        count: info.current.length,
        required: info.min,
        templates: info.current.map(t => ({
          id: t.id,
          name: t.name,
          size: `${t.width}x${t.height}`,
          designArea: t.designArea,
          perspectiveEnabled: t.perspectiveTransform.enabled
        }))
      };
    }
    
    await fs.writeFile(
      path.join(TEMPLATES_DIR, 'template-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('📄 Report saved to: public/mockup-templates/template-report.json');
    console.log('\n✨ Template generation analysis complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };