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
  Smartphone,
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
import { useAuth } from "@/components/auth-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

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
}

type DocumentFilter = "All" | "Renewal";

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

const formatImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.includes("uc?export=view")) return url;
  if (url.includes("drive.google.com/file/d/")) {
    const fileId = url.split("/file/d/")[1].split("/")[0];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  return url;
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

  let downloadUrl = imageUrl;

  // If it's a Google Drive link, use the download endpoint
  if (imageUrl.includes("drive.google.com")) {
    const fileId = imageUrl.match(/[-\w]{25,}/)?.[0];
    if (fileId) {
      downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }

  // Create a temporary anchor element
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute(
    "download",
    `${documentName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.jpg` ||
      "document.jpg"
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast({
    title: "Download started",
    description: `Downloading ${documentName}`,
  });
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

export default function DocumentsList() {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, userRole, userName } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<DocumentFilter>("Renewal");
  const [editingRenewalDocId, setEditingRenewalDocId] = useState<number | null>(
    null
  );
  const [tempRenewalDate, setTempRenewalDate] = useState<Date | undefined>(
    undefined
  );
  const [tempNeedsRenewal, setTempNeedsRenewal] = useState<boolean>(false);
  const [imagePopup, setImagePopup] = useState<{ open: boolean; url: string }>({
    open: false,
    url: "",
  });

const isRenewalExpired = (renewalDate: string): boolean => {
  if (!renewalDate) return false;

  try {
    // Handle both DD/MM/YYYY and YYYY-MM-DD formats
    let dateParts: number[];
    if (renewalDate.includes('/')) {
      dateParts = renewalDate.split('/').map(Number);
    } else {
      dateParts = renewalDate.split('-').map(Number);
      // If in YYYY-MM-DD format, rearrange to [DD, MM, YYYY]
      if (dateParts.length === 3) {
        dateParts = [dateParts[2], dateParts[1], dateParts[0]];
      }
    }

    if (dateParts.length !== 3) return false;

    const renewalDateObj = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
    const today = new Date();

    // Reset time components to compare only dates
    today.setHours(0, 0, 0, 0);
    renewalDateObj.setHours(0, 0, 0, 0);

    return renewalDateObj < today;
  } catch (error) {
    console.error("Error parsing renewal date:", error);
    return false;
  }
};

  const handleViewImage = (url: string) => {
    try {
      let imageUrl = formatImageUrl(url);
      window.open(imageUrl, "_blank");
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not open image",
        variant: "destructive",
      });
    }
  };

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
    if (filter) {
      setCurrentFilter(filter);
    }

    fetchDocuments();
  }, [isLoggedIn, router, searchParams]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      // Fetch original documents
      const docsResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec?sheet=Documents"
      );
      const docsData = await docsResponse.json();

      // Fetch updated renewals
      const renewalsResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec?sheet=Updated%20Renewal"
      );
      const renewalsData = await renewalsResponse.json();

      let docs = [];
      if (docsData.success && docsData.data) {
        docs = docsData.data
          .slice(1)
          .map((doc: any[], index: number) => ({
            id: index + 1,
            timestamp: doc[0]
              ? new Date(doc[0]).toISOString()
              : new Date().toISOString(),
            serialNo: doc[15] || doc[1] || "",
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
          }))
          // Only filter for non-admin users
          .filter(
            (doc: Document) =>
              userRole?.toLowerCase() === "admin" ||
              doc.personName?.toLowerCase() === userName?.toLowerCase()
          );

        // Sort original documents by timestamp (newest first)
        docs.sort(
          (a: Document, b: Document) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }

      // Process renewals data and merge with original documents
      if (renewalsData.success && renewalsData.data) {
        const renewals = renewalsData.data
          .slice(1)
          .map((renewal: any[]) => ({
            id: renewal[0] ? parseInt(renewal[0]) : 0,
            timestamp: renewal[0]
              ? new Date(renewal[0]).toISOString()
              : new Date().toISOString(),
            serialNo: renewal[1] || "",
            originalSerialNo: renewal[2] || "",
            name: renewal[3] || "",
            documentType: renewal[4] || "Personal",
            category: renewal[5] || "",
            company: renewal[6] || "",
            tags: renewal[7]
              ? String(renewal[7])
                  .split(",")
                  .map((tag: string) => tag.trim())
              : [],
            originalRenewalDate: formatDateToDDMMYYYY(renewal[8] || ""),
            renewalDate: formatDateToDDMMYYYY(renewal[9] || ""),
            personName: renewal[10] || "",
            email: renewal[11] || "",
            mobile: renewal[12] ? String(renewal[12]) : "",
            imageUrl: renewal[13] || "",
            needsRenewal: true,
          }))
          // Only filter for non-admin users
          .filter(
            (renewal: any) =>
              userRole?.toLowerCase() === "admin" ||
              renewal.personName?.toLowerCase() === userName?.toLowerCase()
          );

        // Sort renewals by timestamp (newest first)
        renewals.sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Merge renewals with original documents
        const mergedDocs = [...docs];
        renewals.forEach((renewal) => {
          const existingIndex = mergedDocs.findIndex(
            (doc) =>
              doc.serialNo === renewal.serialNo ||
              (renewal.originalSerialNo &&
                doc.serialNo === renewal.originalSerialNo)
          );

          if (existingIndex >= 0) {
            mergedDocs[existingIndex] = {
              ...mergedDocs[existingIndex],
              serialNo: renewal.serialNo,
              renewalDate: renewal.renewalDate,
              needsRenewal: true,
              imageUrl: renewal.imageUrl || mergedDocs[existingIndex].imageUrl,
              timestamp: renewal.timestamp,
            };
          } else {
            mergedDocs.unshift({
              id: mergedDocs.length + 1,
              timestamp: renewal.timestamp,
              serialNo: renewal.serialNo,
              name: renewal.name,
              documentType: renewal.documentType,
              category: renewal.category,
              company: renewal.company,
              tags: renewal.tags,
              personName: renewal.personName,
              needsRenewal: true,
              renewalDate: renewal.renewalDate,
              imageUrl: renewal.imageUrl,
              email: renewal.email,
              mobile: renewal.mobile,
            });
          }
        });

        mergedDocs.sort(
          (a: Document, b: Document) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setDocuments(mergedDocs);
      } else {
        setDocuments(docs);
      }
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

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      // Convert to base64 first
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = (error) => reject(error);
      });

      const formData = new FormData();
      formData.append("action", "uploadFile");
      formData.append("fileName", file.name);
      formData.append("mimeType", file.type);
      formData.append("folderId", "1_GCMRvzAsvU5xXMoqzXh-Tdik-EXBu6c");
      formData.append("base64Data", base64String);

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.fileUrl) {
        throw new Error(result.message || "Upload failed");
      }

      return formatImageUrl(result.fileUrl);
    } catch (error) {
      console.error("Upload error:", error);
      throw error; // Re-throw to be caught by caller
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);

      // Upload the image
      const imageUrl = await handleImageUpload(file);
      if (imageUrl) {
        setTempImageUrl(imageUrl);
      }
    }
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

      let newImageUrl = docToUpdate.imageUrl;

      // Only attempt upload if a new image was selected
      if (selectedImage) {
        try {
          const uploadedUrl = await handleImageUpload(selectedImage);
          if (!uploadedUrl) {
            throw new Error("Image upload failed - no URL returned");
          }
          newImageUrl = uploadedUrl;
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          toast({
            title: "Upload Error",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          });
          return; // Exit if upload fails
        }
      }

      // Validate image URL is required for renewals
      if (tempNeedsRenewal && !newImageUrl) {
        toast({
          title: "Error",
          description: "Image is required for document renewal",
          variant: "destructive",
        });
        return;
      }

      const formattedNewDate = tempRenewalDate
        ? formatDateToDDMMYYYY(tempRenewalDate.toISOString())
        : "";
      const formattedOriginalDate = docToUpdate.renewalDate || "";

      // Fetch the last RN number to generate the next one
      let newSerialNo = "RN-001";
      try {
        const fetchResponse = await fetch(
          "https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec?sheet=Updated%20Renewal"
        );
        const fetchData = await fetchResponse.json();

        if (fetchData.success && fetchData.data && fetchData.data.length > 1) {
          const existingRenewals = fetchData.data.slice(1);
          const maxRn = existingRenewals.reduce((max: number, row: any[]) => {
            if (row[1] && row[1].startsWith("RN-")) {
              const num = parseInt(row[1].split("-")[1]);
              return num > max ? num : max;
            }
            return max;
          }, 0);
          newSerialNo = `RN-${(maxRn + 1).toString().padStart(3, "0")}`;
        }
      } catch (fetchError) {
        console.error("Error fetching renewal data:", fetchError);
        // Continue with default RN-001 if fetch fails
      }

      // Prepare form data for submission
      const formData = new FormData();
      formData.append("action", "insert");
      formData.append("sheetName", "Updated Renewal");

      const currentTimestamp = new Date().toISOString();

      const rowData = JSON.stringify([
        currentTimestamp, // Use current timestamp for sorting
        newSerialNo,
        docToUpdate.serialNo,
        docToUpdate.name,
        docToUpdate.documentType,
        docToUpdate.category,
        docToUpdate.company,
        docToUpdate.tags.join(", "),
        formattedOriginalDate,
        formattedNewDate,
        docToUpdate.personName,
        docToUpdate.email,
        docToUpdate.mobile,
        newImageUrl || "",
      ]);

      formData.append("rowData", rowData);

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to update renewal");
      }

      // Update local state
      setDocuments((prevDocs) =>
        prevDocs
          .map((doc) =>
            doc.id === docId
              ? {
                  ...doc,
                  needsRenewal: tempNeedsRenewal,
                  renewalDate: formattedNewDate,
                  serialNo: newSerialNo,
                  imageUrl: newImageUrl || doc.imageUrl,
                  timestamp: currentTimestamp, // Update timestamp to current time
                }
              : doc
          )
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
      );

      toast({
        title: "Success",
        description: `Renewal updated with serial ${newSerialNo}`,
      });
    } catch (error) {
      console.error("Error updating renewal:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while updating renewal information",
        variant: "destructive",
      });
    } finally {
      setEditingRenewalDocId(null);
      setTempRenewalDate(undefined);
      setTempNeedsRenewal(false);
      setSelectedImage(null);
      setPreviewImage(null);
      setTempImageUrl(null);
      setIsLoading(false);
    }
  };

  const handleCancelRenewalEdit = () => {
    setEditingRenewalDocId(null);
    setTempRenewalDate(undefined);
    setTempNeedsRenewal(false);
    setSelectedImage(null);
    setPreviewImage(null);
    setTempImageUrl(null);
  };

const filteredDocuments = documents.filter((doc) => {
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

  if (currentFilter === "Renewal") {
    // Only show if needs renewal AND renewal date is expired
    return matchesSearch && doc.needsRenewal && isRenewalExpired(doc.renewalDate);
  }
  return matchesSearch && (
    !doc.serialNo.startsWith("RN-") || // Keep non-renewal records
    !documents.some(d => 
      d.serialNo !== doc.serialNo && // Not the same document
      (d.serialNo === doc.originalSerialNo || d.originalSerialNo === doc.serialNo) // Not a duplicate
    )
  );
});

  const selectedDocuments = documents.filter((doc) =>
    selectedDocs.includes(doc.id)
  );

  const handleCheckboxChange = (id: number) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
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
    setTempImageUrl(doc.imageUrl || null);
  };

  if (!mounted || !isLoggedIn) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 pt-16 md:pt-8 max-w-[1200px] mx-auto">
      <Toaster />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
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
            <RefreshCw className="h-6 w-6 mr-2 text-emerald-600" />
            Renewal Documents
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
              <SelectTrigger className="w-[180px] border-gray-300 focus:ring-emerald-500 hidden">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Renewal">Needs Renewal</SelectItem>
                <SelectItem value="All">All Documents</SelectItem>
              </SelectContent>
            </Select>

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
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="hidden md:block">
            <Card className="shadow-sm">
              <CardHeader className="bg-gray-50 border-b p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg text-emerald-800 flex items-center">
                    <RefreshCw className="h-5 w-5 mr-2 text-emerald-600 flex-shrink-0" />
                    {currentFilter === "All"
                      ? "All Documents"
                      : "Documents Needing Renewal"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
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
                          Entry Date
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
                            <TableCell className="hidden lg:table-cell p-2 md:p-4 font-mono text-sm">
                              {doc.timestamp
                                ? formatDateTimeDisplay(doc.timestamp)
                                : "-"}
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
                                      if (!checked)
                                        setTempRenewalDate(undefined);
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
                                    <>
                                      <DatePicker
                                        value={tempRenewalDate}
                                        onChange={(date) =>
                                          setTempRenewalDate(date)
                                        }
                                        placeholder="Select date"
                                        className="h-8 text-xs"
                                      />
                                      <div className="mt-2 flex items-center gap-2">
                                        <label
                                          htmlFor={`image-upload-${doc.id}`}
                                          className={`text-xs font-medium ${
                                            !tempImageUrl
                                              ? "text-red-600"
                                              : "text-gray-700"
                                          } cursor-pointer hover:text-emerald-600 flex items-center gap-1`}
                                        >
                                          <ImageIcon className="h-4 w-4" />
                                          {uploadingImage
                                            ? "Uploading..."
                                            : tempImageUrl
                                            ? "Change Image"
                                            : "Upload Image*"}
                                        </label>
                                        <input
                                          id={`image-upload-${doc.id}`}
                                          type="file"
                                          accept="image/*"
                                          onChange={handleImageChange}
                                          className="hidden"
                                          disabled={uploadingImage}
                                        />
                                        {previewImage && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleViewImage(previewImage)
                                            }
                                            className="text-xs text-blue-500 hover:underline"
                                          >
                                            Preview
                                          </button>
                                        )}
                                      </div>
                                      {!tempImageUrl && (
                                        <p className="text-xs text-red-600 mt-1">
                                          Image is required for renewal
                                        </p>
                                      )}
                                    </>
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
                                  <Badge
                                    className={`${
                                      isRenewalExpired(doc.renewalDate)
                                        ? "bg-red-100 text-red-800"
                                        : "bg-amber-100 text-amber-800"
                                    } flex items-center gap-1`}
                                  >
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
                              {doc.imageUrl ? (
                                <button
                                  type="button"
                                  onClick={() => handleViewImage(doc.imageUrl)}
                                  className="text-blue-500 hover:underline"
                                >
                                  <ImageIcon className="h-5 w-5 mr-1" />
                                </button>
                              ) : (
                                "-"
                              )}
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
                                  {userRole?.toLowerCase() === "admin" &&
                                    isRenewalExpired(doc.renewalDate) && (
                                      <DropdownMenuItem
                                        className="cursor-pointer"
                                        onClick={() =>
                                          handleEditRenewalClick(doc)
                                        }
                                      >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Update Renewal
                                      </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={13}
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
          </div>

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
                              <Badge
                                className={`${
                                  isRenewalExpired(doc.renewalDate)
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800"
                                } flex items-center gap-1`}
                              >
                                <RefreshCw className="h-3 w-3" />
                                <span className="font-mono text-xs">
                                  {doc.renewalDate || "Required"}
                                </span>
                              </Badge>
                            )
                          )}
                          {doc.imageUrl && (
                            <button
                              type="button"
                              onClick={() => handleViewImage(doc.imageUrl)}
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
                              handleDownloadDocument(doc.imageUrl, doc.name)
                            }
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          {userRole?.toLowerCase() === "admin" &&
                            isRenewalExpired(doc.renewalDate) && (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => handleEditRenewalClick(doc)}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Update Renewal
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
