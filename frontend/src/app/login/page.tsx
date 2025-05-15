
'use client';

import React, { useState } from 'react';
// import { useRouter } from 'next/navigation'; // Changed from 'next/navigation' to 'next/router' if using older Next.js, but next/navigation is for App Router
// For Vite/React, navigation is typically handled by react-router-dom. Placeholder for now.
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import apiService from '@/services/apiService'; // Adjusted path assuming services is directly under src

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter(); // Placeholder, routing needs to be addressed with react-router-dom or similar for Vite

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Using FormData for application/x-www-form-urlencoded
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await apiService.post('/auth/token', formData, {
        headers: {
          // Axios will set Content-Type to multipart/form-data if you pass FormData
          // For application/x-www-form-urlencoded with Axios, you might need to pass a URLSearchParams object
          // Or ensure the global apiService config handles this, or override here.
          // For simplicity with current apiService (axios), let's try URLSearchParams as it's common for this content type.
          // However, apiService is configured for 'Content-Type': 'application/json' globally.
          // This specific endpoint /auth/token expects 'application/x-www-form-urlencoded'.
          // We need to override headers for this specific call.
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Axios wraps the response in a `data` object. So, response.data is the actual server response.
      const data = response.data;
      
      // Store the token (e.g., in localStorage)
      if (typeof window !== "undefined") {
        localStorage.setItem('accessToken', data.access_token);
        // Redirect to chat page or dashboard using simple window navigation for now
        window.location.href = '/'; 
      }
      
      // router.push('/'); // Placeholder, original redirect

    } catch (err: any) {
      // Axios error handling: error.response.data might contain the error details
      const errorMessage = err.response?.data?.detail || err.message || '发生未知错误，请稍后再试。';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">登录</CardTitle>
          <CardDescription>
            请输入您的用户名和密码以继续。
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

