#!/usr/bin/env node

/**
 * Analyze GraphQL schema and print statistics
 * Usage: node analyze-schema.js schema-core.json
 */

const fs = require('fs');

const schemaFile = process.argv[2] || 'schema-core.json';

if (!fs.existsSync(schemaFile)) {
  console.error(`❌ File not found: ${schemaFile}`);
  console.log('Usage: node analyze-schema.js <schema-file.json>');
  process.exit(1);
}

const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
const types = schema.data.__schema.types;

// Filter out built-in types
const customTypes = types.filter(t => !t.name.startsWith('__'));

// Categorize types
const objectTypes = customTypes.filter(t => t.kind === 'OBJECT' &&
  !['Query', 'Mutation', 'Subscription'].includes(t.name));
const inputTypes = customTypes.filter(t => t.kind === 'INPUT_OBJECT');
const enumTypes = customTypes.filter(t => t.kind === 'ENUM');
const scalarTypes = customTypes.filter(t => t.kind === 'SCALAR');
const interfaceTypes = customTypes.filter(t => t.kind === 'INTERFACE');
const unionTypes = customTypes.filter(t => t.kind === 'UNION');

// Get Query/Mutation/Subscription
const queryType = types.find(t => t.name === schema.data.__schema.queryType?.name);
const mutationType = types.find(t => t.name === schema.data.__schema.mutationType?.name);
const subscriptionType = types.find(t => t.name === schema.data.__schema.subscriptionType?.name);

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  📊 GraphQL Schema Analysis - Twenty CRM');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

console.log('📈 STATISTICS:');
console.log('─────────────────────────────────────────────────────────');
console.log(`   Total Types:        ${customTypes.length}`);
console.log(`   Object Types:       ${objectTypes.length}`);
console.log(`   Input Types:        ${inputTypes.length}`);
console.log(`   Enum Types:         ${enumTypes.length}`);
console.log(`   Scalar Types:       ${scalarTypes.length}`);
console.log(`   Interface Types:    ${interfaceTypes.length}`);
console.log(`   Union Types:        ${unionTypes.length}`);
console.log('');

if (queryType) {
  console.log(`   Queries:            ${queryType.fields?.length || 0}`);
}
if (mutationType) {
  console.log(`   Mutations:          ${mutationType.fields?.length || 0}`);
}
if (subscriptionType) {
  console.log(`   Subscriptions:      ${subscriptionType.fields?.length || 0}`);
}
console.log('');

// CRM Objects
const crmObjects = objectTypes.filter(t =>
  ['Company', 'Person', 'Opportunity', 'Task', 'Note', 'Activity'].some(name =>
    t.name.includes(name)
  )
);

console.log('🏢 MAIN CRM OBJECTS:');
console.log('─────────────────────────────────────────────────────────');
crmObjects.slice(0, 10).forEach(type => {
  const fieldCount = type.fields?.length || 0;
  console.log(`   ${type.name.padEnd(30)} ${fieldCount} fields`);
});
if (crmObjects.length > 10) {
  console.log(`   ... and ${crmObjects.length - 10} more`);
}
console.log('');

// Top queries
console.log('🔍 TOP QUERIES:');
console.log('─────────────────────────────────────────────────────────');
if (queryType?.fields) {
  queryType.fields.slice(0, 10).forEach(field => {
    const args = field.args?.length || 0;
    console.log(`   ${field.name.padEnd(30)} (${args} args)`);
  });
  if (queryType.fields.length > 10) {
    console.log(`   ... and ${queryType.fields.length - 10} more`);
  }
}
console.log('');

// Top mutations
console.log('✏️  TOP MUTATIONS:');
console.log('─────────────────────────────────────────────────────────');
if (mutationType?.fields) {
  mutationType.fields.slice(0, 10).forEach(field => {
    const args = field.args?.length || 0;
    console.log(`   ${field.name.padEnd(30)} (${args} args)`);
  });
  if (mutationType.fields.length > 10) {
    console.log(`   ... and ${mutationType.fields.length - 10} more`);
  }
}
console.log('');

// Enums
console.log('🔢 ENUMS:');
console.log('─────────────────────────────────────────────────────────');
enumTypes.slice(0, 10).forEach(type => {
  const valueCount = type.enumValues?.length || 0;
  console.log(`   ${type.name.padEnd(30)} ${valueCount} values`);
});
if (enumTypes.length > 10) {
  console.log(`   ... and ${enumTypes.length - 10} more`);
}
console.log('');

// Custom scalars
console.log('🔤 CUSTOM SCALARS:');
console.log('─────────────────────────────────────────────────────────');
const customScalars = scalarTypes.filter(t =>
  !['String', 'Int', 'Float', 'Boolean', 'ID'].includes(t.name)
);
customScalars.forEach(type => {
  console.log(`   ${type.name.padEnd(30)} ${type.description || '(no description)'}`);
});
console.log('');

console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Export detailed report
const report = {
  summary: {
    totalTypes: customTypes.length,
    objectTypes: objectTypes.length,
    inputTypes: inputTypes.length,
    enumTypes: enumTypes.length,
    scalarTypes: scalarTypes.length,
    queries: queryType?.fields?.length || 0,
    mutations: mutationType?.fields?.length || 0,
    subscriptions: subscriptionType?.fields?.length || 0,
  },
  crmObjects: crmObjects.map(t => ({
    name: t.name,
    fields: t.fields?.length || 0,
    description: t.description,
  })),
  queries: queryType?.fields?.map(f => f.name) || [],
  mutations: mutationType?.fields?.map(f => f.name) || [],
  enums: enumTypes.map(t => ({
    name: t.name,
    values: t.enumValues?.map(v => v.name) || [],
  })),
};

const reportFile = schemaFile.replace('.json', '-report.json');
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
console.log(`📄 Detailed report saved to: ${reportFile}`);
console.log('');
