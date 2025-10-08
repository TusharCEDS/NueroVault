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

  // ✅ Authenticate Supabase with Clerk token
  const initSupabase = async () => {
    const token = await getToken({ template: "supabase" });
    if (token) {
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: token, // workaround for TS
      });
    }
  };

  // Fetch files from Supabase
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
      const filePath = `${userId}/${Date.now()}-${selectedFile.name}`;

      const { error } = await supabase.storage
        .from("user_uploads")
        .upload(filePath, selectedFile, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      alert("File uploaded successfully!");
      setSelectedFile(null);
      fetchFiles(); // Refresh list
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
      fetchFiles(); // Refresh list
    } catch (err: any) {
      console.error("Delete error:", err.message);
      alert("Delete failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Drag & Drop
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

  return (
    <section className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-3xl font-extrabold text-center mt-6">Dashboard</h2>

        {/* Drag & Drop / File Input */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`mt-10 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 cursor-pointer transition ${
            dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
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
          {selectedFile ? (
            <p className="text-gray-700">{selectedFile.name}</p>
          ) : (
            <p className="text-gray-400 text-center">
              Drag & Drop a file here or click to select
            </p>
          )}
        </div>

        {/* Upload Button */}
        {selectedFile && (
          <div className="w-full mt-4 text-center">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-green-600 text-white rounded-full px-6 py-2 hover:bg-green-700 transition"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        )}

        {/* Files List */}
        <div className="mt-12">
          {loadingFiles ? (
            <p className="text-center text-gray-500">Loading files...</p>
          ) : files.length > 0 ? (
            <ul className="space-y-3">
              {files.map((file) => (
                <li
                  key={file.name}
                  className="flex justify-between items-center bg-white p-4 rounded shadow-sm"
                >
                  <span className="truncate">{file.name}</span>
                  <div className="flex gap-3">
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user_uploads/${userId}/${file.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(file.name)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null /* ✅ no empty folder placeholder */}
        </div>
      </div>
    </section>
  );
}
