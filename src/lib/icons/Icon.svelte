<!-- src/lib/icons/Icon.svelte -->
<script context="module" lang="ts">
  // 1) All your SVGs in one place:
  const iconMap: Record<string, string> = {
    Cart: `<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 xmlns="http://www.w3.org/2000/svg">
           <circle cx="9" cy="21" r="1"/>
           <circle cx="20" cy="21" r="1"/>
           <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
         </svg>`,

    Car: `<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13l1.5-4.5h15L21 13"/>
          <path d="M5 13v5h3v-5"/>
          <path d="M16 13v5h3v-5"/>
          <path d="M5 8l2-3h10l2 3"/>
        </svg>`,

    Home: `<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9l9-7 9 7"/>
            <path d="M9 22V12h6v10"/>
          </svg>`,

    Film: `<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="2" ry="2"/>
            <line x1="7" y1="2" x2="7" y2="22"/>
            <line x1="17" y1="2" x2="17" y2="22"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
          </svg>`,

    User: `<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                xmlns="http://www.w3.org/2000/svg">
           <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
           <circle cx="12" cy="7" r="4"/>
         </svg>`,

    Gift: `<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 xmlns="http://www.w3.org/2000/svg">
           <rect x="2" y="7" width="20" height="5"/>
           <line x1="12" y1="7" x2="12" y2="22"/>
           <path d="M12 7a4 4 0 0 1-4-4 4 4 0 0 1 4 4"/>
           <path d="M12 7a4 4 0 0 0 4-4 4 4 0 0 0-4 4"/>
         </svg>`,

    Heart: `<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 xmlns="http://www.w3.org/2000/svg">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.4l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/>
          </svg>`,

    Airplane: `<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}"
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                     xmlns="http://www.w3.org/2000/svg">
               <path d="M2.5 19.5l19-7.5-19-7.5 2 7 7.5 2-7.5 2z"/>
             </svg>`,
  };

  // 2) Export list of available keys
  export const icons = Object.keys(iconMap);

  // 3) Helper to grab raw SVG
  export function fetchSvg(name: string): string | undefined {
    return iconMap[name];
  }
</script>

<script lang="ts">
  // 4) Import the helper under a new name to avoid collision
  import { fetchSvg as getSvg } from './Icon.svelte';

  export let name: string;
  export let size: number = 24;
  export let color: string = 'currentColor';

  // 5) Get the template or fallback
  const template = getSvg(name);
  let svg = template
    ? template
    : `<svg width="{size}" height="{size}" viewBox="0 0 24 24">
         <text x="0" y="15" fill="red">?</text>
       </svg>`;
</script>

<!-- 6) Inject SVG with real size/color -->
{@html svg
    .replace(/\{size\}/g, size.toString())
    .replace(/\{color\}/g, color)
}

<style>
  /* Ensure the injected SVG scales properly */
  :global(svg) {
    display: block;
  }
</style>