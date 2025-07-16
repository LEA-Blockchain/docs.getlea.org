import * as path from 'node:path';
import { defineConfig } from 'rspress/config';
import { lipsSidebar } from './.rspress/lips-sidebar';
import { toolsSidebar } from './.rspress/tools-sidebar';
import { npmSidebar } from './.rspress/npm-sidebar';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'LEA Chain',
  description: 'Technical Documentation for LEA Chain',
  icon: '/logo.png',
  logo: {
    light: '/logo.png',
    dark: '/logo.png',
  },
  themeConfig: {
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          link: '/guide/',
        },
      ],
      '/lips/': lipsSidebar,
      '/tools/': toolsSidebar,
      '/npm-module/': npmSidebar,
      '/development/': [
        {
          text: 'Development',
          link: '/development/',
        },
      ],
    },
    nav: [
      {
        text: 'Home',
        link: '/',
      },
      {
        text: 'Guide',
        link: '/guide',
      },
      {
        text: 'LIPs',
        link: '/lips/',
      },
      {
        text: 'NPM Module',
        link: '/npm-module/',
      },
      {
        text: 'Tools',
        link: '/tools/',
      },
      {
        text: 'Development',
        link: '/development/',
      },
    ],
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/web-infra-dev/rspress',
      },
    ],
  },
});
