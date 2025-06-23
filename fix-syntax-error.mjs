#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing syntax error in App.jsx...\n');

const appPath = path.join(process.cwd(), 'src/App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Find and fix the syntax error around line 140
// The issue is a stray backtick after the closing brace
appContent = appContent.replace(/}\s*`\s*}/g, '}\n  }');

// Also ensure handleEventClick is properly formatted
const handleEventClickRegex = /const handleEventClick = \(info\) => \{[\s\S]*?setShowAssignmentDetails\(true\)\s*}\s*`?\s*}/;
const correctHandleEventClick = `const handleEventClick = (info) => {
    const { event } = info
    const assignment = assignments.find(a => a.id === event.id)
    setSelectedAssignment(assignment)
    setShowAssignmentDetails(true)
  }`;

appContent = appContent.replace(handleEventClickRegex, correctHandleEventClick);

// Write the fixed content
fs.writeFileSync(appPath, appContent);

console.log('✅ Fixed syntax error!');
console.log('\n🎉 Your app should reload automatically.');
