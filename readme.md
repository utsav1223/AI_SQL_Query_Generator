for generating react app cmd - npm create vite@latest .




configure the tailwind css
1) go to tailwind css website 
https://tailwindcss.com/docs/installation/using-vite

[Step-1]
npm install tailwindcss @tailwindcss/vite

[Step-2]
in vite.config.js paste this - 
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})

[step-3]
in index.css paste this -
@import "tailwindcss";



one library we have to install npm install framer-motion