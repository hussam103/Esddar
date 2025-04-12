import { useState, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, File, AlertCircle, CheckCircle } from 'lucide-react';

export function DocumentUpload() {
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
      const response = await apiRequest(
        'POST', 
        '/api/upload-company-document',
        formData,
        (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        setDocumentId(data.documentId);
        setUploadStatus('processing');
        
        // Start processing the document
        const processResponse = await apiRequest(
          'POST',
          `/api/process-company-document/${data.documentId}`
        );
        
        if (processResponse.ok) {
          // Start checking the processing status
          checkProcessingStatus(data.documentId);
        } else {
          const processError = await processResponse.json();
          throw new Error(processError.message || 'Failed to process document');
        }
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err: any) {
      setUploadStatus('error');
      setError(err.message || 'An error occurred during upload');
      toast({
        title: language === 'ar' ? 'فشل التحميل' : 'Upload Failed',
        description: err.message || (language === 'ar' 
          ? 'حدث خطأ أثناء تحميل المستند' 
          : 'An error occurred during document upload'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const checkProcessingStatus = async (docId: string) => {
    try {
      const response = await apiRequest('GET', `/api/check-document-status/${docId}`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.status === 'completed') {
          setUploadStatus('success');
          toast({
            title: language === 'ar' ? 'تم المعالجة بنجاح' : 'Processing Successful',
            description: language === 'ar'
              ? 'تمت معالجة المستند واستخراج المعلومات بنجاح'
              : 'Document processed and information extracted successfully',
          });
          
          // Refresh the page to show the extracted information
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else if (data.status === 'error') {
          setUploadStatus('error');
          setError(data.message || 'Processing failed');
        } else {
          // Still processing, check again after 5 seconds
          setTimeout(() => checkProcessingStatus(docId), 5000);
        }
      } else {
        throw new Error(data.message || 'Failed to check processing status');
      }
    } catch (err: any) {
      setUploadStatus('error');
      setError(err.message || 'An error occurred while checking processing status');
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
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 cursor-pointer transition-colors"
              onClick={triggerFileSelect}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <File className="h-10 w-10 text-primary mb-2" />
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">
                    {language === 'ar'
                      ? 'اسحب وأفلت أو انقر للتحميل'
                      : 'Drag and drop or click to upload'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar'
                      ? 'يجب أن يكون الملف بتنسيق PDF والحجم الأقصى 10 ميغابايت'
                      : 'File must be PDF and maximum size 10MB'}
                  </p>
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
            <div className="border rounded-lg p-6">
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                <p className="text-sm font-medium">
                  {language === 'ar' ? 'جاري معالجة المستند...' : 'Processing document...'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'ar'
                    ? 'يتم استخراج النص والمعلومات من المستند. قد تستغرق هذه العملية بضع دقائق.'
                    : 'Extracting text and information from the document. This process may take a few minutes.'}
                </p>
              </div>
            </div>
          )}
          
          {uploadStatus === 'success' && (
            <div className="border rounded-lg p-6 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
              <div className="flex flex-col items-center">
                <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  {language === 'ar' ? 'تمت المعالجة بنجاح' : 'Processing Successful'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'ar'
                    ? 'تمت معالجة المستند واستخراج المعلومات بنجاح'
                    : 'Document processed and information extracted successfully'}
                </p>
              </div>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="border rounded-lg p-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
              <div className="flex flex-col items-center">
                <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  {language === 'ar' ? 'حدث خطأ' : 'An Error Occurred'}
                </p>
                {error && (
                  <p className="text-xs text-red-500 mt-1 text-center">{error}</p>
                )}
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