"use client";

import React, { useState, useEffect, useRef } from "react";
import NavBar from "@/components/NavBar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@clerk/nextjs";

export default function Dashboard() {
  const { getToken, userId } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const initSupabase = async () => {
    const token = await getToken({ template: "supabase" });
    if (token) {
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: token,
      });
    }
  };

  const fetchFiles = async () => {
    if (!userId) return;
    setLoadingFiles(true);

    try {
      await initSupabase();
      const { data, error } = await supabase.storage
        .from("user_uploads")
        .list(`${userId}/`, { limit: 100 });

      if (error) throw error;
      setFiles(data || []);
    } catch (err: any) {
      console.error("Fetch files error:", err.message);
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [userId]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      await initSupabase();
      const filePath = `${userId}/${selectedFile.name}`;

      const { error } = await supabase.storage
        .from("user_uploads")
        .upload(filePath, selectedFile, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      alert("File uploaded successfully!");
      setSelectedFile(null);
      fetchFiles();
    } catch (err: any) {
      console.error("Upload error:", err.message);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!userId) return;
    setUploading(true);

    try {
      await initSupabase();
      const filePath = `${userId}/${fileName}`;
      const { error } = await supabase.storage
        .from("user_uploads")
        .remove([filePath]);

      if (error) throw error;

      alert("File deleted successfully!");
      fetchFiles();
    } catch (err: any) {
      console.error("Delete error:", err.message);
      alert("Delete failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <NavBar />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            File Manager Dashboard
          </h2>
          <p className="text-gray-600">Upload, manage, and organize your files securely</p>
        </div>

        {/* Upload Section */}
        <div className="mb-16">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-16 cursor-pointer transition-all duration-300 ${
              dragOver
                ? "border-indigo-500 bg-indigo-50 scale-[1.02] shadow-xl"
                : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50 shadow-lg hover:shadow-xl"
            }`}
          >
            <input
              type="file"
              ref={inputRef}
              className="hidden"
              onChange={(e) =>
                e.target.files && handleFileSelect(e.target.files[0])
              }
            />
            
            <div className="flex flex-col items-center justify-center gap-4">
              <div className={`p-5 rounded-full transition-all duration-300 ${
                dragOver ? "bg-indigo-100 scale-110" : "bg-gradient-to-br from-indigo-100 to-purple-100"
              }`}>
                <svg className={`w-16 h-16 transition-colors ${dragOver ? "text-indigo-600" : "text-indigo-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              {selectedFile ? (
                <div className="text-center space-y-2">
                  <p className="text-xl font-semibold text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500 bg-gray-100 px-4 py-1 rounded-full inline-block">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xl font-semibold text-gray-900 mb-2">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    All file types supported • Maximum size 100MB
                  </p>
                </div>
              )}
            </div>

            {uploading && (
              <div className="absolute bottom-0 left-0 w-full">
                <div className="h-2 bg-gray-200">
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 animate-pulse" 
                       style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="group relative px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  "Upload File"
                )}
                <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
              </button>
            </div>
          )}
        </div>

        {/* Files Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Your Files</h3>
            <span className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full font-medium">
              {files.length} {files.length === 1 ? "file" : "files"}
            </span>
          </div>

          {loadingFiles ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
              <p className="mt-4 text-gray-500">Loading files...</p>
            </div>
          ) : files.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="group bg-white rounded-xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 transform hover:-translate-y-2"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <button
                      onClick={() => handleDelete(file.name)}
                      disabled={uploading}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      <svg className="w-5 h-5 text-red-500 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2 truncate text-lg" title={file.name}>
                    {file.name}
                  </h4>
                  <p className="text-sm text-gray-500 mb-4">
                    {file.metadata?.size ? formatFileSize(file.metadata.size) : "Unknown size"}
                  </p>
                  
                  <div className="flex gap-2">
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user_uploads/${userId}/${file.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </a>
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user_uploads/${userId}/${file.name}`}
                      download
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-xl font-semibold mb-2">No files yet</p>
              <p className="text-gray-400 text-sm">Upload your first file to get started</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}