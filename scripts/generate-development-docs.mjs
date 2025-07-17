

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sources = [
  {
    name: 'stdlea',
    url: 'https://raw.githubusercontent.com/LEA-Blockchain/stdlea/refs/heads/main/README.md',
  },
  {
    name: 'sctp',
    url: 'https://raw.githubusercontent.com/LEA-Blockchain/sctp/refs/heads/main/README.md',
  },
];

const generatedDir = join(__dirname, '../docs-src/development/generated');
const rspressDir = join(__dirname, '../.rspress');

async function fetchContent(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.text();
}

function extractTitle(content) {
  const firstLine = content.split('\n')[0];
  const match = firstLine.match(/^#\s*(.*)/);
  return match ? match[1] : 'Untitled';
}

async function generateDocs() {
  console.log('Starting Development documentation generation...');
  await mkdir(generatedDir, { recursive: true });

  const sidebarItems = [];

  for (const source of sources) {
    try {
      const content = await fetchContent(source.url);
      const title = extractTitle(content);
      const pageContent = `---\ntitle: ${title}\n---\n\n${content}`;
      const filePath = join(generatedDir, `${source.name}.md`);
      await writeFile(filePath, pageContent);
      console.log(`[SUCCESS] Generated page for ${source.name}`);

      sidebarItems.push({
        text: title,
        link: `/development/generated/${source.name}`,
      });
    } catch (error) {
      console.error(`[ERROR] Failed to process ${source.name}:`, error);
    }
  }

  const sidebarContent = `export const development = ${JSON.stringify(sidebarItems, null, 2)};`;
  const sidebarPath = join(rspressDir, 'development-sidebar.ts');
  await writeFile(sidebarPath, sidebarContent);
  console.log(`[SUCCESS] Generated sidebar at ${sidebarPath}`);

  console.log('Development documentation generation complete.');
}

generateDocs();

