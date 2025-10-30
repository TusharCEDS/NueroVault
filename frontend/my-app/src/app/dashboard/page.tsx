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
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [analyzingFile, setAnalyzingFile] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("user_uploads")
        .upload(filePath, selectedFile, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Extract text from file
      const extractFormData = new FormData();
      extractFormData.append("file", selectedFile);

      const extractResponse = await fetch("/api/extract-text", {
        method: "POST",
        body: extractFormData,
      });

      const { text: extractedText, fileType } = await extractResponse.json();

      setUploadProgress(70);

      // Generate embedding
      const embeddingResponse = await fetch("/api/generate-embedding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });

      const { embedding } = await embeddingResponse.json();

      setUploadProgress(90);

      // Store single record in database
      const { error: dbError } = await supabase
        .from("file_embeddings")
        .insert({
          user_id: userId,
          file_name: selectedFile.name,
          file_path: filePath,
          content_text: extractedText,
          file_type: fileType,
          file_size: selectedFile.size,
          embedding: embedding,
        });

      if (dbError) throw dbError;

      setUploadProgress(100);
      alert("File uploaded and indexed successfully!");
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

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("user_uploads")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("file_embeddings")
        .delete()
        .eq("user_id", userId)
        .eq("file_name", fileName);

      if (dbError) throw dbError;

      alert("File deleted successfully!");
      fetchFiles();
    } catch (err: any) {
      console.error("Delete error:", err.message);
      alert("Delete failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !userId) return;
    setSearching(true);
    setShowSearchResults(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          userId: userId,
        }),
      });

      const { results } = await response.json();
      setSearchResults(results || []);
    } catch (err: any) {
      console.error("Search error:", err.message);
      alert("Search failed: " + err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleAnalyze = async (file: any) => {
    setAnalyzingFile(file.file_name || file.name);
    
    try {
      // Get file content from database
      const { data, error } = await supabase
        .from("file_embeddings")
        .select("content_text, file_name")
        .eq("user_id", userId)
        .eq("file_name", file.file_name || file.name)
        .single();

      if (error) throw error;

      // Analyze file
      const response = await fetch("/api/analyze-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: data.file_name,
          contentText: data.content_text,
        }),
      });

      const result = await response.json();
      setAnalysisResult(result);
      setShowAnalysisModal(true);
    } catch (err: any) {
      console.error("Analysis error:", err.message);
      alert("Analysis failed: " + err.message);
    } finally {
      setAnalyzingFile(null);
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

  const displayFiles = showSearchResults ? searchResults : files;

  return (
    <section className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <NavBar />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            File Manager Dashboard
          </h2>
          <p className="text-gray-600">Upload, manage, and search your files with AI</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search files by content (e.g., 'invoice from last month')"
                className="w-full px-6 py-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-900 placeholder-gray-400 shadow-sm"
              />
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? "Searching..." : "Search"}
            </button>
            {showSearchResults && (
              <button
                onClick={() => {
                  setShowSearchResults(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Clear
              </button>
            )}
          </div>
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
                    PDF, Word, Excel, Images, Text files • Max 100MB
                  </p>
                </div>
              )}
            </div>

            {uploading && (
              <div className="absolute bottom-0 left-0 w-full">
                <div className="h-2 bg-gray-200">
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300" 
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
                {uploading ? `Uploading... ${uploadProgress}%` : "Upload & Index"}
                <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
              </button>
            </div>
          )}
        </div>

        {/* Files Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {showSearchResults ? "Search Results" : "Your Files"}
            </h3>
            <span className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full font-medium">
              {displayFiles.length} {displayFiles.length === 1 ? "file" : "files"}
            </span>
          </div>

          {loadingFiles ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
              <p className="mt-4 text-gray-500">Loading files...</p>
            </div>
          ) : displayFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayFiles.map((file) => (
                <div
                  key={file.id || file.name}
                  className="group bg-white rounded-xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 transform hover:-translate-y-2"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <button
                      onClick={() => handleDelete(file.file_name || file.name)}
                      disabled={uploading}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      <svg className="w-5 h-5 text-red-500 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2 truncate text-lg" title={file.file_name || file.name}>
                    {file.file_name || file.name}
                  </h4>
                  <p className="text-sm text-gray-500 mb-2">
                    {file.file_size ? formatFileSize(file.file_size) : (file.metadata?.size ? formatFileSize(file.metadata.size) : "Unknown size")}
                  </p>
                  
                  {/* Show similarity score for search results */}
                  {showSearchResults && file.similarity && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-600">Relevance:</span>
                        <span className="text-xs font-semibold text-indigo-600">
                          {Math.round(file.similarity * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 h-1.5 rounded-full"
                          style={{ width: `${file.similarity * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Show content preview for search results */}
                  {showSearchResults && file.content_text && (
                    <p className="text-xs text-gray-600 mb-4 line-clamp-2 italic bg-gray-50 p-2 rounded">
                      {file.content_text.substring(0, 150)}...
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user_uploads/${userId}/${file.file_name || file.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </a>
                    <button
                      onClick={() => handleAnalyze(file)}
                      disabled={analyzingFile === (file.file_name || file.name)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {analyzingFile === (file.file_name || file.name) ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          ...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Analyze
                        </>
                      )}
                    </button>
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
              <p className="text-gray-600 text-xl font-semibold mb-2">
                {showSearchResults ? "No results found" : "No files yet"}
              </p>
              <p className="text-gray-400 text-sm">
                {showSearchResults ? "Try a different search query" : "Upload your first file to get started"}
              </p>
            </div>
          )}
        </div>

        {/* Analysis Modal */}
        {showAnalysisModal && analysisResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">File Analysis</h3>
                    <p className="text-indigo-100 text-sm">{analysisResult.fileName}</p>
                  </div>
                  <button
                    onClick={() => setShowAnalysisModal(false)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Summary */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Summary
                  </h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed">
                    {analysisResult.analysis.summary}
                  </p>
                </div>

                {/* Category */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Category
                  </h4>
                  <span className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-medium">
                    {analysisResult.analysis.category}
                  </span>
                </div>

                {/* Topics */}
                {analysisResult.analysis.topics?.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Key Topics
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.analysis.topics.map((topic: string, idx: number) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insights */}
                {analysisResult.analysis.insights?.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Key Insights
                    </h4>
                    <ul className="space-y-2">
                      {analysisResult.analysis.insights.map((insight: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 bg-green-50 p-3 rounded-lg">
                          <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-700">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-2xl border-t">
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}