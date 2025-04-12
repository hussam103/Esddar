import { useState, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, File, AlertCircle, CheckCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DocumentUploadProps {
  onSuccess?: () => void;
}

export function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'processing' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' 
          ? 'يرجى تحميل ملف PDF فقط' 
          : 'Please upload a PDF file only',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar'
          ? 'حجم الملف كبير جدًا. الحد الأقصى هو 10 ميغابايت'
          : 'File is too large. Maximum size is 10MB',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedFile(file);
    setUploadStatus('idle');
    setError(null);
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      console.log(`Starting upload of file ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
      
      // Validate file type again
      if (selectedFile.type !== 'application/pdf') {
        throw new Error(language === 'ar' 
          ? 'نوع الملف غير صالح. يرجى تحميل ملف PDF فقط' 
          : 'Invalid file type. Please upload a PDF file only');
      }
      
      // Validate file size again
      if (selectedFile.size > 10 * 1024 * 1024) {
        throw new Error(language === 'ar'
          ? 'حجم الملف كبير جدًا. الحد الأقصى هو 10 ميغابايت'
          : 'File is too large. Maximum size is 10MB');
      }
      
      const response = await apiRequest(
        'POST', 
        '/api/upload-company-document',
        formData,
        (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress}%`);
        }
      );
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error(language === 'ar'
          ? 'تعذر معالجة استجابة الخادم. يرجى المحاولة مرة أخرى.'
          : 'Could not process server response. Please try again.');
      }
      
      if (response.ok) {
        console.log(`File uploaded successfully. Document ID: ${data.documentId}`);
        setDocumentId(data.documentId);
        setUploadStatus('processing');
        
        // Start processing the document
        try {
          const processResponse = await apiRequest(
            'POST',
            `/api/process-company-document/${data.documentId}`
          );
          
          if (processResponse.ok) {
            console.log(`Document processing started for document ID: ${data.documentId}`);
            // Start checking the processing status
            checkProcessingStatus(data.documentId);
          } else {
            const processError = await processResponse.json();
            console.error("Process document error:", processError);
            throw new Error(processError.message || (language === 'ar'
              ? 'فشل في معالجة المستند'
              : 'Failed to process document'));
          }
        } catch (processErr) {
          console.error("Error initiating document processing:", processErr);
          throw new Error(language === 'ar'
            ? 'تم تحميل المستند ولكن تعذر بدء المعالجة. يرجى المحاولة مرة أخرى.'
            : 'Document uploaded but processing could not be initiated. Please try again.');
        }
      } else {
        console.error("Upload failed with status:", response.status, data);
        let errorMessage = data.message || data.error || (language === 'ar' ? 'فشل التحميل' : 'Upload failed');
        
        // Provide more specific error messages based on status codes
        if (response.status === 413) {
          errorMessage = language === 'ar'
            ? 'حجم الملف كبير جدًا. الحد الأقصى هو 10 ميغابايت'
            : 'File is too large. Maximum size is 10MB';
        } else if (response.status === 415) {
          errorMessage = language === 'ar'
            ? 'نوع الملف غير مدعوم. يرجى تحميل ملف PDF فقط'
            : 'Unsupported file type. Please upload a PDF file only';
        } else if (response.status === 401) {
          errorMessage = language === 'ar'
            ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى'
            : 'Session expired. Please login again';
        } else if (response.status === 500) {
          errorMessage = language === 'ar'
            ? 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقًا'
            : 'Server error occurred. Please try again later';
        }
        
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("Document upload error:", err);
      setUploadStatus('error');
      
      const errorMessage = err.message || (language === 'ar' 
        ? 'حدث خطأ أثناء تحميل المستند' 
        : 'An error occurred during document upload');
      
      setError(errorMessage);
      
      toast({
        title: language === 'ar' ? 'فشل التحميل' : 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const checkProcessingStatus = async (docId: string, retryCount: number = 0, maxRetries: number = 60) => {
    try {
      console.log(`Checking processing status for document ID: ${docId} (Attempt ${retryCount + 1}/${maxRetries})`);
      
      if (retryCount >= maxRetries) {
        throw new Error(language === 'ar'
          ? 'انتهت مهلة معالجة المستند. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.'
          : 'Document processing timed out. Please try again or contact support.');
      }
      
      const response = await apiRequest('GET', `/api/check-document-status/${docId}`);
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Error parsing status response:", parseError);
        throw new Error(language === 'ar'
          ? 'تعذر معالجة استجابة الخادم. يرجى المحاولة مرة أخرى.'
          : 'Could not process server response. Please try again.');
      }
      
      if (response.ok) {
        console.log(`Processing status for document ${docId}: ${data.status || 'unknown'}`);
        
        if (data.status === 'completed') {
          console.log(`Document ${docId} processing completed successfully`);
          setUploadStatus('success');
          toast({
            title: language === 'ar' ? 'تم المعالجة بنجاح' : 'Processing Successful',
            description: language === 'ar'
              ? 'تمت معالجة المستند واستخراج المعلومات بنجاح'
              : 'Document processed and information extracted successfully',
          });
          
          // Call the onSuccess callback if provided
          if (onSuccess) {
            onSuccess();
          } else {
            // If no callback, just refresh the page after delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        } else if (data.status === 'error') {
          console.error(`Document ${docId} processing failed:`, data.message);
          setUploadStatus('error');
          setError(data.message || (language === 'ar'
            ? 'فشلت معالجة المستند'
            : 'Processing failed'));
          
          // Show toast for processing error
          toast({
            title: language === 'ar' ? 'فشل المعالجة' : 'Processing Failed',
            description: data.message || (language === 'ar'
              ? 'حدث خطأ أثناء معالجة المستند. يرجى المحاولة مرة أخرى.'
              : 'An error occurred while processing the document. Please try again.'),
            variant: 'destructive',
          });
        } else {
          // Still processing, show more detailed status if available
          const processingMessage = data.message || (language === 'ar'
            ? 'لا تزال معالجة المستند جارية...'
            : 'Document is still being processed...');
            
          console.log(`Document ${docId} still processing: ${processingMessage}`);
          
          // Update progress message if relevant
          if (retryCount % 5 === 0) { // Only update visible UI occasionally
            // Here we could update a progress message if we had one
          }
          
          // Check again after 5 seconds
          setTimeout(() => checkProcessingStatus(docId, retryCount + 1, maxRetries), 5000);
        }
      } else {
        console.error(`Error checking document ${docId} status:`, data);
        let errorMessage = data.message || data.error || (language === 'ar'
          ? 'فشل في التحقق من حالة المعالجة'
          : 'Failed to check processing status');
          
        // Handle specific error cases
        if (response.status === 404) {
          errorMessage = language === 'ar'
            ? 'المستند غير موجود. قد يكون تم حذفه.'
            : 'Document not found. It may have been deleted.';
        } else if (response.status === 401) {
          errorMessage = language === 'ar'
            ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
            : 'Session expired. Please login again.';
        }
        
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error(`Error checking document ${docId} processing status:`, err);
      setUploadStatus('error');
      
      const errorMessage = err.message || (language === 'ar'
        ? 'حدث خطأ أثناء التحقق من حالة معالجة المستند'
        : 'An error occurred while checking document processing status');
      
      setError(errorMessage);
      
      // Only show toast for critical errors, not for normal retries
      if (retryCount > 3) {
        toast({
          title: language === 'ar' ? 'خطأ في المعالجة' : 'Processing Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {language === 'ar' ? 'تحميل مستند ملف الشركة' : 'Upload Company Profile Document'}
        </CardTitle>
        <CardDescription>
          {language === 'ar'
            ? 'قم بتحميل ملف الشركة الرسمي (PDF فقط). سيتم استبدال أي ملف موجود مسبقاً.'
            : 'Upload your official company profile document (PDF only). Any existing document will be replaced.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="application/pdf"
            className="hidden"
          />
          
          {uploadStatus === 'idle' && (
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 text-center hover:border-primary/50 cursor-pointer transition-all hover:shadow-md group"
              onClick={triggerFileSelect}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <File className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-md font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="mt-4 text-primary/80">
                    {language === 'ar'
                      ? 'انقر لتغيير الملف'
                      : 'Click to change file'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors group-hover:scale-105 transition-transform">
                    <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-md font-medium mb-2">
                    {language === 'ar'
                      ? 'اسحب وأفلت أو انقر للتحميل'
                      : 'Drag and drop or click to upload'}
                  </p>
                  <div className="max-w-sm">
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      {language === 'ar'
                        ? 'يجب أن يكون الملف بتنسيق PDF والحجم الأقصى 10 ميغابايت'
                        : 'File must be PDF and maximum size 10MB'}
                    </p>
                    <p className="text-xs text-primary/80 px-6">
                      {language === 'ar'
                        ? 'سنقوم باستخراج معلومات شركتك من المستند لمساعدتنا في العثور على المناقصات المناسبة لك'
                        : 'We\'ll extract your company information from the document to help us find suitable tenders for you'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {uploadStatus === 'uploading' && (
            <div className="border rounded-lg p-6">
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                <p className="text-sm font-medium">
                  {language === 'ar' ? 'جاري تحميل المستند...' : 'Uploading document...'}
                </p>
                <div className="w-full mt-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-right mt-1 text-muted-foreground">
                    {uploadProgress}%
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {uploadStatus === 'processing' && (
            <div className="border rounded-lg p-8 bg-blue-50/30 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-2 w-2 bg-primary rounded-full" />
                  </div>
                </div>
                <p className="text-md font-medium text-primary mb-2">
                  {language === 'ar' ? 'جاري معالجة المستند...' : 'Processing document...'}
                </p>
                <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
                  {language === 'ar'
                    ? 'يتم استخراج النص والمعلومات من المستند. قد تستغرق هذه العملية بضع دقائق.'
                    : 'Extracting text and information from the document. This process may take a few minutes.'}
                </p>
                <div className="w-full max-w-xs mt-6 space-y-2">
                  <p className="text-xs text-muted-foreground mb-1 text-center">
                    {language === 'ar' ? 'الرجاء الانتظار' : 'Please wait'}
                  </p>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <div className="animate-progress absolute inset-y-0 left-0 w-1/3 bg-primary/60 transition-all duration-300" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {uploadStatus === 'success' && (
            <div className="border rounded-lg p-8 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
              <div className="flex flex-col items-center">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.1
                    }}
                  >
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg font-medium text-green-700 dark:text-green-300 mb-2">
                    {language === 'ar' ? 'تمت المعالجة بنجاح!' : 'Processing Successful!'}
                  </p>
                  <p className="text-sm text-center text-green-600 dark:text-green-400 max-w-sm">
                    {language === 'ar'
                      ? 'تمت معالجة المستند واستخراج المعلومات بنجاح. سيساعدنا هذا في العثور على المناقصات المناسبة لشركتك.'
                      : 'Document processed and information extracted successfully. This will help us find suitable tenders for your company.'}
                  </p>
                </motion.div>
              </div>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="border rounded-lg p-8 border-red-200 bg-red-50/70 dark:bg-red-950/20 dark:border-red-900">
              <div className="flex flex-col items-center">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-4"
                >
                  <AlertCircle className="h-12 w-12 text-red-500" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <p className="text-lg font-medium text-red-700 dark:text-red-300 mb-2">
                    {language === 'ar' ? 'حدث خطأ أثناء المعالجة' : 'Error Processing Document'}
                  </p>
                  {error && (
                    <p className="text-sm text-red-600 mt-1 text-center max-w-md">
                      {error}
                    </p>
                  )}
                  
                  {/* Show specific guidance if the error is about API limits */}
                  {error && error.includes('processing limit') ? (
                    <div className="mt-3 border border-amber-200 bg-amber-50 p-3 rounded-md text-sm text-amber-800">
                      {language === 'ar'
                        ? 'تم الوصول إلى الحد اليومي لمعالجة المستندات. يرجى المحاولة مرة أخرى غدًا أو الاتصال بفريق الدعم للحصول على حل فوري.'
                        : 'The daily document processing limit has been reached. Please try again tomorrow or contact our support team for an immediate solution.'}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-4">
                      {language === 'ar'
                        ? 'يرجى المحاولة مرة أخرى أو الاتصال بالدعم إذا استمرت المشكلة'
                        : 'Please try again or contact support if the problem persists'}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            {uploadStatus === 'idle' && selectedFile && (
              <Button 
                onClick={uploadFile}
                disabled={isUploading || !selectedFile}
              >
                {language === 'ar' ? 'تحميل المستند' : 'Upload Document'}
              </Button>
            )}
            
            {(uploadStatus === 'error' || uploadStatus === 'success') && (
              <Button 
                onClick={() => {
                  setSelectedFile(null);
                  setUploadStatus('idle');
                  setError(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                variant="outline"
              >
                {language === 'ar' ? 'تحميل مستند آخر' : 'Upload Another Document'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}