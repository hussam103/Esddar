import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Upload, FileText, CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PAGES = 100;

export function DocumentUpload() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingState, setProcessingState] = useState<
    "idle" | "uploading" | "processing" | "analyzing" | "completed" | "error"
  >("idle");
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const getFileIcon = () => {
    if (processingState === "completed") return <CheckCircle className="h-12 w-12 text-green-500" />;
    if (processingState === "error") return <AlertCircle className="h-12 w-12 text-red-500" />;
    if (file) return <FileText className="h-12 w-12 text-primary-500" />;
    return <Upload className="h-12 w-12 text-gray-400" />;
  };

  const validateFile = (file: File): { valid: boolean; message?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        message: language === "ar"
          ? "حجم الملف يتجاوز الحد الأقصى (10 ميجابايت)"
          : "File size exceeds maximum limit (10MB)",
      };
    }

    if (file.type !== "application/pdf") {
      return {
        valid: false,
        message: language === "ar"
          ? "يرجى تحميل ملف بتنسيق PDF فقط"
          : "Please upload a PDF file only",
      };
    }

    return { valid: true };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setAlertMessage(validation.message || "");
      setShowAlertDialog(true);
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    setProcessingState("idle");
    setUploadProgress(0);
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setProcessingState("uploading");

      const formData = new FormData();
      formData.append("file", file);

      // First upload to our server
      const uploadResponse = await apiRequest(
        "POST",
        "/api/upload-company-document",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            }
          },
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const { documentId } = await uploadResponse.json();
      
      // Now start OCR and analysis processing
      setProcessingState("processing");
      
      const processResponse = await apiRequest(
        "POST", 
        `/api/process-company-document/${documentId}`,
        null
      );
      
      if (!processResponse.ok) {
        throw new Error("Failed to process document");
      }
      
      // Wait for processing to complete
      setProcessingState("analyzing");
      
      // Poll for processing status
      let processingComplete = false;
      while (!processingComplete) {
        const statusResponse = await apiRequest(
          "GET",
          `/api/check-document-status/${documentId}`,
          null
        );
        
        if (!statusResponse.ok) {
          throw new Error("Failed to check document status");
        }
        
        const status = await statusResponse.json();
        if (status.status === "completed") {
          processingComplete = true;
        } else if (status.status === "error") {
          throw new Error(status.message || "Error processing document");
        } else {
          // Wait for 2 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      setProcessingState("completed");
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-profile"] });
      toast({
        title: language === "ar" ? "تم تحميل المستند بنجاح" : "Document uploaded successfully",
        description: language === "ar"
          ? "تم معالجة ملف الشركة بنجاح وإضافة البيانات إلى ملفك الشخصي"
          : "Company document has been processed and data added to your profile",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      setProcessingState("error");
      toast({
        title: language === "ar" ? "فشل في تحميل المستند" : "Failed to upload document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    const validation = validateFile(droppedFile);
    if (!validation.valid) {
      setAlertMessage(validation.message || "");
      setShowAlertDialog(true);
      return;
    }

    setFile(droppedFile);
    setProcessingState("idle");
    setUploadProgress(0);
  };

  const renderProcessingState = () => {
    switch (processingState) {
      case "uploading":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm text-gray-500">
                {language === "ar" ? "جارٍ تحميل المستند..." : "Uploading document..."}
              </p>
            </div>
            <Progress value={uploadProgress} className="h-2 w-full" />
            <p className="text-xs text-gray-500 text-right">{uploadProgress}%</p>
          </div>
        );
      case "processing":
        return (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            <p className="text-sm text-gray-500">
              {language === "ar"
                ? "جارٍ معالجة المستند باستخدام OCR..."
                : "Processing document with OCR..."}
            </p>
          </div>
        );
      case "analyzing":
        return (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">
              {language === "ar"
                ? "جارٍ تحليل المستند باستخدام الذكاء الاصطناعي..."
                : "Analyzing document with AI..."}
            </p>
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-sm text-green-600">
              {language === "ar"
                ? "تمت معالجة المستند بنجاح!"
                : "Document processed successfully!"}
            </p>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-600">
              {language === "ar"
                ? "حدث خطأ أثناء معالجة المستند"
                : "Error processing document"}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {language === "ar" ? "تحميل ملف الشركة" : "Upload Company Document"}
          </CardTitle>
          <CardDescription>
            {language === "ar"
              ? "قم بتحميل ملف PDF يحتوي على معلومات الشركة ونشاطاتها (الحد الأقصى: 10 ميجابايت، 100 صفحة)"
              : "Upload a PDF containing company information and activities (Max: 10MB, 100 pages)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center space-y-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              file ? "border-primary-300 bg-primary-50" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf"
              disabled={processingState !== "idle" && processingState !== "error"}
            />
            <div className="flex flex-col items-center space-y-2">
              {getFileIcon()}
              <div className="text-sm font-medium">
                {file
                  ? file.name
                  : language === "ar"
                  ? "انقر أو اسحب ملف PDF هنا"
                  : "Click or drag a PDF file here"}
              </div>
              <div className="text-xs text-gray-500">
                {language === "ar"
                  ? "الحد الأقصى للحجم: 10 ميجابايت، 100 صفحة"
                  : "Max size: 10MB, 100 pages"}
              </div>
            </div>
          </div>

          {renderProcessingState()}

          <div className="mt-4 flex items-start space-x-2 rtl:space-x-reverse">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-500">
              {language === "ar" 
                ? "سيتم استخدام هذا المستند لاستخراج معلومات حول نشاطات شركتك لتحسين توصيات المناقصات. المستندات المدعومة: ملفات PDF (مفضل ملفات قابلة للبحث) وأيضاً المستندات الممسوحة ضوئياً."
                : "This document will be used to extract information about your company's activities to improve tender recommendations. Supported documents: PDF files (searchable PDFs preferred) and scanned documents."}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            disabled={
              !file ||
              processingState === "uploading" ||
              processingState === "processing" ||
              processingState === "analyzing"
            }
            onClick={handleUpload}
          >
            {processingState === "uploading" ||
            processingState === "processing" ||
            processingState === "analyzing" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === "ar" ? "جارٍ المعالجة..." : "Processing..."}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {language === "ar" ? "تحميل المستند" : "Upload Document"}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ar" ? "خطأ في الملف" : "File Error"}
            </AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>
              {language === "ar" ? "حسناً" : "OK"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}