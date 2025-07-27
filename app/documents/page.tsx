"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Download,
  FileText,
  Mail,
  MoreHorizontal,
  Search,
  Share2,
  Smartphone,
  Trash2,
  User,
  Briefcase,
  Users,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  Loader2,
  Check,
  X as XIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { EmailShareDialog } from "@/components/email-share-dialog";
import { WhatsAppShareDialog } from "@/components/whatsapp-share-dialog";
import { useAuth } from "@/components/auth-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Document {
  id: number;
  timestamp: string;
  serialNo: string;
  name: string;
  documentType: string;
  category: string;
  company: string;
  tags: string[];
  personName: string;
  needsRenewal: boolean;
  renewalDate: string;
  imageUrl: string;
  email: string;
  mobile: string;
  sourceSheet: string;
  isDeleted: boolean;
}

type DocumentFilter = "All" | "Personal" | "Company" | "Director" | "Renewal";

const formatDateToDDMMYYYY = (dateString: string): string => {
  if (!dateString) return "";

  try {
    let date: Date;

    if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const parts = dateString.split("/");
      date = new Date(
        parseInt(parts[2]),
        parseInt(parts[1]) - 1,
        parseInt(parts[0])
      );
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        date = new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0])
        );
        if (isNaN(date.getTime())) {
          return dateString;
        }
      } else {
        return dateString;
      }
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

const formatDateTimeDisplay = (dateString: string): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    if (hours === "00" && minutes === "00" && seconds === "00") {
      const now = new Date();
      return `${day}/${month}/${year} || ${now
        .getHours()
        .toString()
        .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
    }

    return `${day}/${month}/${year} || ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Loading Documents
        </h3>
        <p className="text-sm text-gray-500">
          Please wait while we fetch your documents...
        </p>
      </div>
    </div>
  </div>
);

const ImagePreviewDialog = ({
  open,
  onOpenChange,
  imageUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Document Image</DialogTitle>
          <DialogDescription>
            Preview of the uploaded document image
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center h-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Document"
              className="max-w-full max-h-[70vh] object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No image available
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="mt-4">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function DocumentsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [shareMethod, setShareMethod] = useState<"email" | "whatsapp" | null>(
    null
  );
  const [mounted, setMounted] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<DocumentFilter>("All");
  const [editingRenewalDocId, setEditingRenewalDocId] = useState<number | null>(
    null
  );
  const [tempRenewalDate, setTempRenewalDate] = useState<Date | undefined>(
    undefined
  );
  const [tempNeedsRenewal, setTempNeedsRenewal] = useState<boolean>(false);
  const [emailData, setEmailData] = useState({
    to: "",
    name: "",
    subject: "",
    message: "",
  });
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setMounted(true);

    const search = searchParams.get("search");
    if (search) {
      setSearchTerm(search);
    }

    const filter = searchParams.get("filter") as DocumentFilter;
    if (
      filter &&
      ["Personal", "Company", "Director", "Renewal"].includes(filter)
    ) {
      setCurrentFilter(filter);
    }

    fetchDocuments();
  }, [isLoggedIn, router, searchParams]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      // Fetch from both sheets
      const [documentsResponse, renewalsResponse] = await Promise.all([
        fetch(
          "https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec?sheet=Documents"
        ),
        fetch(
          "https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec?sheet=Updated Renewal"
        ),
      ]);

      const [documentsData, renewalsData] = await Promise.all([
        documentsResponse.json(),
        renewalsResponse.json(),
      ]);

      let docs: Document[] = [];

      // Process Documents sheet
      if (documentsData.success && documentsData.data) {
        docs = documentsData.data.slice(1).map((doc: any[], index: number) => ({
          id: index + 1,
          timestamp: doc[0]
            ? new Date(doc[0]).toISOString()
            : new Date().toISOString(),
          serialNo: doc[1] || "",
          name: doc[2] || "",
          documentType: doc[3] || "Personal",
          category: doc[4] || "",
          company: doc[5] || "",
          tags: doc[6]
            ? String(doc[6])
                .split(",")
                .map((tag: string) => tag.trim())
            : [],
          personName: doc[7] || "",
          needsRenewal: doc[8] === "TRUE" || doc[8] === "Yes" || false,
          renewalDate: formatDateToDDMMYYYY(doc[9] || ""),
          imageUrl: doc[11] || "",
          email: doc[12] || "",
          mobile: doc[13] ? String(doc[13]) : "",
          sourceSheet: "Documents",
          isDeleted: !!doc[14], // Column O (index 14) - if it has a value, document is deleted
        }));
      }

      // Process Updated Renewal sheet
      if (renewalsData.success && renewalsData.data) {
        const renewalDocs = renewalsData.data
          .slice(1)
          .map((doc: any[], index: number) => {
            const renewalInfo = doc[9] || "";
            let needsRenewal = false;
            let renewalDate = "";

            if (renewalInfo) {
              const parsedDate = new Date(renewalInfo);
              if (!isNaN(parsedDate.getTime())) {
                needsRenewal = true;
                renewalDate = formatDateToDDMMYYYY(renewalInfo);
              } else {
                needsRenewal =
                  renewalInfo === "TRUE" ||
                  renewalInfo === "Yes" ||
                  renewalInfo === "Requires Renewal" ||
                  renewalInfo.toLowerCase().includes("renew");
              }
            }

            return {
              id: index + 1000000,
              timestamp: doc[0]
                ? new Date(doc[0]).toISOString()
                : new Date().toISOString(),
              serialNo: doc[1] || "",
              name: doc[3] || "",
              documentType: "Renewal",
              category: doc[5] || "",
              company: doc[6] || "",
              tags: doc[7]
                ? String(doc[7])
                    .split(",")
                    .map((tag: string) => tag.trim())
                : [],
              personName: doc[10] || "",
              needsRenewal: needsRenewal,
              renewalDate: renewalDate,
              imageUrl: doc[13] || "",
              email: doc[11] || "",
              mobile: doc[12] ? String(doc[12]) : "",
              sourceSheet: "Updated Renewal",
              isDeleted: !!doc[14], // Column O (index 14) - if it has a value, document is deleted
            };
          });

        docs = [...docs, ...renewalDocs];
      }

      // Filter out deleted documents
      docs = docs.filter(doc => !doc.isDeleted);

      // Sort by timestamp (newest first)
      docs.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Assign sequential IDs
      docs = docs.map((doc, index) => ({ ...doc, id: index + 1 }));

      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

const handleDeleteDocument = async (docId: number) => {
  try {
    setIsLoading(true);
    const docToDelete = documents.find((doc) => doc.id === docId);
    if (!docToDelete) {
      toast({
        title: "Error",
        description: "Document not found",
        variant: "destructive",
      });
      return;
    }

    // Create URL parameters
    const params = new URLSearchParams();
    params.append('sheetName', docToDelete.sourceSheet);
    params.append('serialNo', docToDelete.serialNo);
    params.append('timestamp', docToDelete.timestamp);
    params.append('action', 'markDeleted');

    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec?${params.toString()}`,
      {
        method: "GET",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const textResponse = await response.text();
    let result;
    
    try {
      result = JSON.parse(textResponse);
    } catch (e) {
      // If response isn't JSON, treat it as a success if it contains "Google Apps Script is running"
      if (textResponse.includes("Google Apps Script is running")) {
        // Update local state to reflect deletion
        setDocuments((prevDocs) =>
          prevDocs.map((doc) =>
            doc.id === docId ? { ...doc, isDeleted: true } : doc
          )
        );
        setSelectedDocs((prevSelected) =>
          prevSelected.filter((id) => id !== docId)
        );

        toast({
          title: "Success",
          description: "Document marked as deleted",
        });
        return;
      }
      throw new Error(textResponse || "Unknown response from server");
    }

    if (!result.success) {
      throw new Error(result.message || "Failed to mark document as deleted");
    }

    // Update local state to reflect deletion
    setDocuments((prevDocs) =>
      prevDocs.map((doc) =>
        doc.id === docId ? { ...doc, isDeleted: true } : doc
      )
    );
    setSelectedDocs((prevSelected) =>
      prevSelected.filter((id) => id !== docId)
    );

    toast({
      title: "Success",
      description: "Document marked as deleted",
    });
  } catch (error) {
    console.error("Delete error:", error);
    
    let errorMessage = "Failed to mark document as deleted";
    if (error instanceof Error) {
      errorMessage = error.message.includes("Google Apps Script is running") 
        ? "Document deletion request sent" 
        : error.message;
    }

    toast({
      title: errorMessage.includes("Google Apps Script is running") 
        ? "Info" 
        : "Error",
      description: errorMessage,
      variant: errorMessage.includes("Google Apps Script is running") 
        ? "default" 
        : "destructive",
    });

    // Even if we get the default response, consider it a success
    if (error instanceof Error && error.message.includes("Google Apps Script is running")) {
      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc.id === docId ? { ...doc, isDeleted: true } : doc
        )
      );
      setSelectedDocs((prevSelected) =>
        prevSelected.filter((id) => id !== docId)
      );
    }
  } finally {
    setIsLoading(false);
  }
};

const handleDownloadDocument = (imageUrl: string, documentName: string) => {
  if (!imageUrl) {
    toast({
      title: "No image available",
      description: "This document doesn't have an image to download",
      variant: "destructive",
    });
    return;
  }

  // Extract file ID from Google Drive URL
  const fileId = imageUrl.match(/[-\w]{25,}/)?.[0];
  
  if (!fileId) {
    // Fallback to direct download if not a Google Drive URL
    const link = document.createElement("a");
    link.href = imageUrl;
    link.setAttribute("download", 
      `${documentName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.jpg` || 
      "document.jpg"
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // Use Google Drive's download URL
    window.open(
      `https://drive.google.com/uc?export=download&id=${fileId}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  toast({
    title: "Download started",
    description: `Downloading ${documentName}`,
  });
};

  const handleSaveRenewalDate = async (docId: number) => {
    setIsLoading(true);
    try {
      const docToUpdate = documents.find((doc) => doc.id === docId);
      if (!docToUpdate) {
        toast({
          title: "Error",
          description: "Document not found",
          variant: "destructive",
        });
        return;
      }

      const formattedDate = tempRenewalDate
        ? formatDateToDDMMYYYY(tempRenewalDate.toISOString())
        : "";

      const formData = new FormData();
      formData.append("action", "updateRenewal");
      formData.append("sheetName", "Updated Renewal");
      formData.append("documentId", docId.toString());
      formData.append("documentName", docToUpdate.name);
      formData.append("documentType", docToUpdate.documentType);
      formData.append("category", docToUpdate.category);
      formData.append("company", docToUpdate.company);
      formData.append("personName", docToUpdate.personName);
      formData.append("needsRenewal", tempNeedsRenewal.toString());
      formData.append("renewalDate", formattedDate);
      formData.append("email", docToUpdate.email);
      formData.append("mobile", docToUpdate.mobile);
      formData.append("imageUrl", docToUpdate.imageUrl);
      formData.append("originalSerialNo", docToUpdate.serialNo);
      formData.append("timestamp", new Date().toISOString());

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        setDocuments((prevDocs) =>
          prevDocs.map((doc) =>
            doc.id === docId
              ? {
                  ...doc,
                  needsRenewal: tempNeedsRenewal,
                  renewalDate: formattedDate,
                  serialNo: result.newSerialNo || doc.serialNo,
                }
              : doc
          )
        );

        toast({
          title: "Success",
          description: "Renewal information updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update renewal information",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating renewal:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating renewal information",
        variant: "destructive",
      });
    } finally {
      setEditingRenewalDocId(null);
      setTempRenewalDate(undefined);
      setTempNeedsRenewal(false);
      setIsLoading(false);
    }
  };

  const handleCancelRenewalEdit = () => {
    setEditingRenewalDocId(null);
    setTempRenewalDate(undefined);
    setTempNeedsRenewal(false);
  };

const filteredDocuments = documents
  .filter((doc) => !doc.isDeleted) // Exclude deleted documents by default
  .filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(doc.email).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(doc.mobile).toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.serialNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesFilter =
      currentFilter === "All" ||
      (currentFilter === "Renewal" && doc.needsRenewal) ||
      doc.category === currentFilter;

    return matchesSearch && matchesFilter;
  });

  const selectedDocuments = documents.filter((doc) =>
    selectedDocs.includes(doc.id)
  );

  const handleCheckboxChange = (id: number) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

const handleShareEmail = async (emailData: {
  to: string;
  name: string;
  subject: string;
  message: string;
}) => {
  try {
    setIsLoading(true);
    
    // Create payload
    const payload = {
      action: "shareViaEmail",
      recipientEmail: emailData.to,
      recipientName: emailData.name || "",
      subject: emailData.subject,
      message: emailData.message,
      documents: selectedDocuments.map(doc => ({
        id: doc.id.toString(),
        name: doc.name,
        serialNo: doc.serialNo,
        documentType: doc.documentType,
        category: doc.category
      }))
    };

    console.log("Sending payload:", payload);

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const textResponse = await response.text();
    console.log("Raw response:", textResponse);

    let result;
    try {
      result = JSON.parse(textResponse);
    } catch (e) {
      console.error("Failed to parse response:", e);
      throw new Error("Invalid server response");
    }

    if (!result.success) {
      throw new Error(result.error || "Failed to share documents");
    }

    toast({
      title: "Success",
      description: result.message || "Documents shared successfully",
    });
    return true;
  } catch (error) {
    console.error("Error sharing documents:", error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to share documents",
      variant: "destructive",
    });
    return false;
  } finally {
    setIsLoading(false);
  }
};

  const handleShareWhatsApp = () => {
    if (!whatsappNumber) return;

    const selectedDocNames = documents
      .filter((doc) => selectedDocs.includes(doc.id))
      .map((doc) => doc.name)
      .join(", ");

    const text = `I'm sharing these documents with you: ${selectedDocNames}`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      text
    )}`;

    window.open(whatsappUrl, "_blank");

    toast({
      title: "Opening WhatsApp",
      description: `${selectedDocs.length} documents are being shared via WhatsApp to +${whatsappNumber}`,
    });

    setWhatsappNumber("");
    setShareMethod(null);
  };

  const handleFilterChange = (value: string) => {
    setCurrentFilter(value as DocumentFilter);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (value === "All") {
      newSearchParams.delete("filter");
    } else {
      newSearchParams.set("filter", value);
    }
    router.push(`?${newSearchParams.toString()}`);
  };

  const handleEditRenewalClick = (doc: Document) => {
    setEditingRenewalDocId(doc.id);
    setTempRenewalDate(
      doc.renewalDate
        ? new Date(doc.renewalDate.split("/").reverse().join("-"))
        : undefined
    );
    setTempNeedsRenewal(doc.needsRenewal);
  };

  if (!mounted || !isLoggedIn) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 pt-16 md:pt-8 max-w-[1200px] mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <Toaster />

      {/* Fixed header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 sticky top-0 bg-white z-10 py-2">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mr-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
          >
            <Link href="/">
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </>
            </Link>
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-emerald-800 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-emerald-600" />
            All Documents
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search documents..."
              className="pl-8 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              onValueChange={handleFilterChange}
              value={currentFilter}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px] border-gray-300 focus:ring-emerald-500">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Documents</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Company">Company</SelectItem>
                <SelectItem value="Director">Director</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 flex-1 sm:flex-none">
              <Button
                size="sm"
                disabled={selectedDocs.length === 0 || isLoading}
                onClick={() => setShareMethod("email")}
                className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none"
              >
                <Mail className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Share via Email</span>
                <span className="sm:hidden">Email</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                disabled={selectedDocs.length === 0 || isLoading}
                onClick={() => setShareMethod("whatsapp")}
                className="flex-1 sm:flex-none"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Share via WhatsApp</span>
                <span className="sm:hidden">WhatsApp</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <Card className="shadow-sm h-full flex flex-col">
            <CardHeader className="bg-gray-50 border-b p-4 md:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg text-emerald-800 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-emerald-600 flex-shrink-0" />
                  {currentFilter === "All"
                    ? "All Documents"
                    : `${currentFilter} Documents`}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-white"
                  asChild
                >
                  <Link href="/documents/add">
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New
                    </>
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              <div className="overflow-x-auto h-full">
                <Table className="min-w-full">
                  <TableHeader className="bg-gray-50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-12 p-2 md:p-4">
                        <Checkbox
                          checked={
                            selectedDocs.length > 0 &&
                            selectedDocs.length === filteredDocuments.length
                          }
                          onCheckedChange={() => {
                            if (
                              selectedDocs.length === filteredDocuments.length
                            ) {
                              setSelectedDocs([]);
                            } else {
                              setSelectedDocs(
                                filteredDocuments.map((doc) => doc.id)
                              );
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="p-2 md:p-4">Serial No</TableHead>
                      <TableHead className="p-2 md:p-4">
                        Document Name
                      </TableHead>
                      <TableHead className="hidden md:table-cell p-2 md:p-4">
                        Category
                      </TableHead>
                      <TableHead className="hidden md:table-cell p-2 md:p-4">
                        Company/Dept
                      </TableHead>
                      <TableHead className="hidden md:table-cell p-2 md:p-4">
                        Name
                      </TableHead>
                      <TableHead className="hidden lg:table-cell p-2 md:p-4">
                        Email
                      </TableHead>
                      <TableHead className="hidden lg:table-cell p-2 md:p-4">
                        Mobile
                      </TableHead>
                      <TableHead className="hidden md:table-cell p-2 md:p-4">
                        Renewal
                      </TableHead>
                      <TableHead className="hidden lg:table-cell p-2 md:p-4">
                        Tags
                      </TableHead>
                      <TableHead className="hidden lg:table-cell p-2 md:p-4">
                        Image
                      </TableHead>
                      <TableHead className="text-right p-2 md:p-4">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-gray-50">
                          <TableCell className="p-2 md:p-4">
                            <Checkbox
                              checked={selectedDocs.includes(doc.id)}
                              onCheckedChange={() =>
                                handleCheckboxChange(doc.id)
                              }
                            />
                          </TableCell>
                          <TableCell className="p-2 md:p-4 font-mono text-sm">
                            {doc.serialNo || "-"}
                          </TableCell>
                          <TableCell className="p-2 md:p-4">
                            <div className="flex items-center min-w-0">
                              {doc.category === "Personal" ? (
                                <User className="h-4 w-4 mr-2 text-emerald-500 flex-shrink-0" />
                              ) : doc.category === "Company" ? (
                                <Briefcase className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                              ) : (
                                <Users className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="font-medium truncate text-sm md:text-base">
                                  {doc.name}
                                </div>
                                <div className="md:hidden text-xs text-gray-500 truncate">
                                  {doc.serialNo} • {doc.category} •{" "}
                                  {doc.company}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell p-2 md:p-4">
                            <Badge
                              className={`${
                                doc.category === "Personal"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : doc.category === "Company"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {doc.category || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell p-2 md:p-4">
                            {doc.company || "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell p-2 md:p-4">
                            {doc.personName || "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell p-2 md:p-4">
                            {doc.email || "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell p-2 md:p-4">
                            {doc.mobile || "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell p-2 md:p-4">
                            {editingRenewalDocId === doc.id ? (
                              <div className="flex flex-col gap-2 items-start max-w-[180px]">
                                <Checkbox
                                  id={`needsRenewalEdit-${doc.id}`}
                                  checked={tempNeedsRenewal}
                                  onCheckedChange={(checked: boolean) => {
                                    setTempNeedsRenewal(checked);
                                    if (!checked) setTempRenewalDate(undefined);
                                  }}
                                  className="border-gray-300"
                                />
                                <label
                                  htmlFor={`needsRenewalEdit-${doc.id}`}
                                  className="text-xs font-medium mr-2"
                                >
                                  Needs Renewal
                                </label>
                                {tempNeedsRenewal && (
                                  <DatePicker
                                    value={tempRenewalDate}
                                    onChange={(date) =>
                                      setTempRenewalDate(date)
                                    }
                                    placeholder="Select date"
                                    className="h-8 text-xs"
                                  />
                                )}
                                <div className="flex gap-1 mt-1">
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() =>
                                      handleSaveRenewalDate(doc.id)
                                    }
                                    className="h-7 px-2"
                                    disabled={isLoading}
                                  >
                                    <Check className="h-3 w-3 mr-1" /> Save
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={handleCancelRenewalEdit}
                                    className="h-7 px-2"
                                    disabled={isLoading}
                                  >
                                    <XIcon className="h-3 w-3 mr-1" /> Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : doc.needsRenewal ? (
                              <div className="flex items-center">
                                <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
                                  <RefreshCw className="h-3 w-3" />
                                  <span className="font-mono text-xs">
                                    {doc.renewalDate || "Required"}
                                  </span>
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell p-2 md:p-4">
                            <div className="flex flex-wrap gap-1">
                              {doc.tags.map((tag, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs bg-gray-50 text-gray-700 hover:bg-gray-100"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell p-2 md:p-4">
                            <a
                              href={doc.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ImageIcon className="h-5 w-5 mr-1" />
                            </a>
                          </TableCell>
                          <TableCell className="text-right p-2 md:p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() =>
                                    handleDownloadDocument(
                                      doc.imageUrl,
                                      doc.name
                                    )
                                  }
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer text-red-600 focus:text-red-600"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={12}
                          className="text-center py-8 text-gray-500"
                        >
                          {searchTerm || currentFilter !== "All" ? (
                            <>No documents found matching your criteria.</>
                          ) : (
                            <>
                              <div className="flex flex-col items-center justify-center py-8">
                                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                                <p className="mb-4">No documents found.</p>
                                <Button
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  asChild
                                >
                                  <Link href="/documents/add">
                                    <>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add New Document
                                    </>
                                  </Link>
                                </Button>
                              </div>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile view */}
      <div className="md:hidden mt-4">
        {filteredDocuments.length > 0 && (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="shadow-sm overflow-hidden">
                <div
                  className={`p-3 border-l-4 ${
                    doc.category === "Personal"
                      ? "border-l-emerald-500"
                      : doc.category === "Company"
                      ? "border-l-blue-500"
                      : "border-l-amber-500"
                  } flex items-center justify-between`}
                >
                  <div className="flex items-center min-w-0">
                    <Checkbox
                      checked={selectedDocs.includes(doc.id)}
                      onCheckedChange={() => handleCheckboxChange(doc.id)}
                      className="mr-3"
                    />
                    {doc.category === "Personal" ? (
                      <User className="h-5 w-5 mr-2 text-emerald-500 flex-shrink-0" />
                    ) : doc.category === "Company" ? (
                      <Briefcase className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" />
                    ) : (
                      <Users className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate text-sm">
                        {doc.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        Serial: {doc.serialNo || "N/A"} • {doc.category}
                      </div>
                      <div className="text-xs text-gray-500 truncate font-mono">
                        {doc.timestamp
                          ? formatDateTimeDisplay(doc.timestamp)
                          : "No Date"}
                      </div>
                      {doc.email && (
                        <div className="text-xs text-gray-500 truncate">
                          {doc.email}
                        </div>
                      )}
                      {doc.mobile && (
                        <div className="text-xs text-gray-500 truncate">
                          {doc.mobile}
                        </div>
                      )}
                      {editingRenewalDocId === doc.id ? (
                        <div className="flex flex-col gap-2 items-start mt-2">
                          <Checkbox
                            id={`needsRenewalEditMobile-${doc.id}`}
                            checked={tempNeedsRenewal}
                            onCheckedChange={(checked: boolean) => {
                              setTempNeedsRenewal(checked);
                              if (!checked) setTempRenewalDate(undefined);
                            }}
                            className="border-gray-300"
                          />
                          <label
                            htmlFor={`needsRenewalEditMobile-${doc.id}`}
                            className="text-xs font-medium mr-2"
                          >
                            Needs Renewal
                          </label>
                          {tempNeedsRenewal && (
                            <DatePicker
                              value={tempRenewalDate}
                              onChange={(date) => setTempRenewalDate(date)}
                              placeholder="Select date"
                              className="h-8 text-xs"
                            />
                          )}
                          <div className="flex gap-1 mt-1">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleSaveRenewalDate(doc.id)}
                              className="h-7 px-2"
                              disabled={isLoading}
                            >
                              <Check className="h-3 w-3 mr-1" /> Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={handleCancelRenewalEdit}
                              className="h-7 px-2"
                              disabled={isLoading}
                            >
                              <XIcon className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        doc.needsRenewal && (
                          <Badge className="mt-1 bg-amber-100 text-amber-800 text-xs flex items-center gap-1 w-fit">
                            <RefreshCw className="h-3 w-3" />
                            <span className="font-mono">
                              {doc.renewalDate || "Required"}
                            </span>
                          </Badge>
                        )
                      )}
                      {doc.imageUrl && (
                        <button
                          onClick={() => setViewingImage(doc.imageUrl)}
                          className="mt-1 flex items-center text-xs text-blue-500"
                        >
                          <ImageIcon className="h-3 w-3 mr-1" />
                          View Image
                        </button>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EmailShareDialog
  open={shareMethod === "email"}
  onOpenChange={(open) => !open && setShareMethod(null)}
  emailData={emailData}
  setEmailData={setEmailData}
  selectedDocuments={selectedDocuments}
  onShare={handleShareEmail}
/>

      <WhatsAppShareDialog
        open={shareMethod === "whatsapp"}
        onOpenChange={(open) => !open && setShareMethod(null)}
        whatsappNumber={whatsappNumber}
        setWhatsappNumber={setWhatsappNumber}
        selectedDocuments={selectedDocuments}
        onShare={handleShareWhatsApp}
      />

      <ImagePreviewDialog
        open={viewingImage !== null}
        onOpenChange={(open) => !open && setViewingImage(null)}
        imageUrl={viewingImage || ""}
      />
    </div>
  );
}
