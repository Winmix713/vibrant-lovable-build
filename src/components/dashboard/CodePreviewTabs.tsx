
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ArrowDown } from "lucide-react";
import CodePreview from "@/components/CodePreview";

const CodePreviewTabs = () => {
  // Mock data for previews (kept the same as original)
  const beforeCode = `// pages/index.js
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Layout from '../components/layout'

export default function Home({ posts }) {
  const router = useRouter()
  
  return (
    <Layout>
      <Head>
        <title>My Next.js Blog</title>
      </Head>
      <div className="grid">
        {posts.map(post => (
          <div key={post.id} onClick={() => router.push(\`/posts/\${post.slug}\`)}>
            <Image 
              src={post.image} 
              alt={post.title} 
              width={300} 
              height={200} 
            />
            <h2>{post.title}</h2>
          </div>
        ))}
      </div>
    </Layout>
  )
}

export async function getStaticProps() {
  const res = await fetch('https://api.example.com/posts')
  const posts = await res.json()
  return { props: { posts } }
}`;

  const afterCode = `// src/pages/Home.jsx
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout'

export default function Home() {
  const navigate = useNavigate()
  
  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await fetch('https://api.example.com/posts')
      return res.json()
    }
  })
  
  return (
    <Layout>
      <div className="grid">
        {posts?.map(post => (
          <div key={post.id} onClick={() => navigate(\`/posts/\${post.slug}\`)}>
            <img 
              src={post.image} 
              alt={post.title} 
              width={300} 
              height={200} 
              loading="lazy"
            />
            <h2>{post.title}</h2>
          </div>
        ))}
      </div>
    </Layout>
  )
}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Code Preview</CardTitle>
        <CardDescription>See how your code will be converted</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="home-page">
          <TabsList className="mb-4">
            <TabsTrigger value="home-page">Home Page</TabsTrigger>
            <TabsTrigger value="api-route">API Route</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="home-page" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CodePreview title="Next.js" code={beforeCode} />
              <div className="hidden lg:flex items-center justify-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <ArrowRight className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex lg:hidden items-center justify-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <ArrowDown className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <CodePreview title="Vite + React Router" code={afterCode} />
            </div>
          </TabsContent>
          
          <TabsContent value="api-route">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CodePreview 
                title="Next.js API Route" 
                code={`// pages/api/posts.js
export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ posts: [...] })
  } else if (req.method === 'POST') {
    const { title, content } = req.body
    // Create post
    res.status(201).json({ message: 'Created' })
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(\`Method \${req.method} Not Allowed\`)
  }
}`} 
              />
              <div className="hidden lg:flex items-center justify-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <ArrowRight className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex lg:hidden items-center justify-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <ArrowDown className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <CodePreview 
                title="Express API Route" 
                code={`// server/routes/posts.js
import express from 'express'
const router = express.Router()

router.get('/', (req, res) => {
  res.status(200).json({ posts: [...] })
})

router.post('/', (req, res) => {
  const { title, content } = req.body
  // Create post
  res.status(201).json({ message: 'Created' })
})

export default router

// server/index.js
import express from 'express'
import postsRouter from './routes/posts.js'

const app = express()
app.use(express.json())
app.use('/api/posts', postsRouter)

app.listen(3001, () => {
  console.log('API server running on port 3001')
})`} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="config">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CodePreview 
                title="Next.js Config" 
                code={`// next.config.js
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['images.example.com'],
  },
  env: {
    API_URL: process.env.API_URL
  },
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  }
}`} 
              />
              <div className="hidden lg:flex items-center justify-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <ArrowRight className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex lg:hidden items-center justify-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <ArrowDown className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <CodePreview 
                title="Vite Config" 
                code={`// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
  },
  define: {
    'import.meta.env.API_URL': JSON.stringify(process.env.API_URL),
  },
  // Added with external i18n plugin like i18next
  // i18n configured separately
})`} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CodePreviewTabs;
