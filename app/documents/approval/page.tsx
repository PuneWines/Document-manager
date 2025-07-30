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
  CheckCircle,
  Trash,
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
  status: string;
}

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

  if (imageUrl.includes("drive.google.com")) {
    const fileId = imageUrl.match(/[-\w]{25,}/)?.[0];
    if (fileId) {
      downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }

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

export default function ApprovalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, userRole, userName } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [imagePopup, setImagePopup] = useState<{ open: boolean; url: string }>({
    open: false,
    url: "",
  });

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

    fetchDocuments();
  }, [isLoggedIn, router, searchParams]);

const fetchDocuments = async () => {
  setIsLoading(true);
  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec?sheet=Approval%20Documents"
    );
    const data = await response.json();

    if (data.success && data.data) {
      const docs = data.data.slice(1).map((doc: any[], index: number) => ({
        id: index + 1,
        timestamp: doc[0] ? new Date(doc[0]).toISOString() : new Date().toISOString(),
        serialNo: doc[1] || "",
        name: doc[2] || "",
        documentType: doc[3] || "Personal",
        category: doc[4] || "",
        company: doc[5] || "",
        tags: doc[6] ? String(doc[6]).split(",").map((tag: string) => tag.trim()) : [],
        personName: doc[7] || "",
        needsRenewal: doc[8] === "TRUE" || doc[8] === "Yes" || false,
        renewalDate: doc[9] || "",
        imageUrl: doc[11] || "",
        email: doc[12] || "",
        mobile: doc[13] ? String(doc[13]) : "",
        status: doc[14] || "Pending",
      }));

      // Filter to only show pending documents for the current user
      const pendingDocs = docs.filter(
        (doc) => (!doc.status || doc.status.toLowerCase() === "pending") &&
                 (userRole?.toLowerCase() === "admin" || 
                  doc.personName.toLowerCase() === userName?.toLowerCase())
      );

      setDocuments(pendingDocs);
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

  const filteredDocuments = documents.filter((doc) => {
    return (
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(doc.email).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(doc.mobile).toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.serialNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  const handleCheckboxChange = (id: number) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

const handleApprove = async (docId: number) => {
  try {
    const docToApprove = documents.find((doc) => doc.id === docId);
    if (!docToApprove) {
      toast({
        title: "Error",
        description: "Document not found in local data",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          action: "approve",
          sheetName: "Approval Documents",
          serialNo: docToApprove.serialNo,
          timestamp: new Date(docToApprove.timestamp).toISOString()
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      toast({
        title: "Success",
        description: `Document "${docToApprove.name}" has been approved`,
      });
      // Remove the approved document from local state
      setDocuments(documents.filter(doc => doc.id !== docId));
    } else {
      throw new Error(result.error || "Failed to approve document");
    }
  } catch (error) {
    console.error("Error approving document:", error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to approve document",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

const handleReject = async (docId: number) => {
  try {
    const docToReject = documents.find((doc) => doc.id === docId);
    if (!docToReject) {
      toast({
        title: "Error",
        description: "Document not found in local data",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          action: "reject",
          sheetName: "Approval Documents",
          serialNo: docToReject.serialNo,
          timestamp: new Date(docToReject.timestamp).toISOString()
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      toast({
        title: "Success",
        description: `Document "${docToReject.name}" has been rejected`,
      });
      // Remove the rejected document from local state
      setDocuments(documents.filter(doc => doc.id !== docId));
    } else {
      throw new Error(result.error || "Failed to reject document");
    }
  } catch (error) {
    console.error("Error rejecting document:", error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to reject document",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
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
            <CheckCircle className="h-6 w-6 mr-2 text-emerald-600" />
            Approval Dashboard
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
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDocuments}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
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
                    <CheckCircle className="h-5 w-5 mr-2 text-emerald-600 flex-shrink-0" />
                    Documents Pending Approval ({filteredDocuments.length})
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
                          Renewal Date
                        </TableHead>
                        <TableHead className="hidden lg:table-cell p-2 md:p-4">
                          Tags
                        </TableHead>
                        <TableHead className="hidden lg:table-cell p-2 md:p-4">
                          Email
                        </TableHead>
                        <TableHead className="hidden lg:table-cell p-2 md:p-4">
                          Mobile
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
                              <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
                                <RefreshCw className="h-3 w-3" />
                                {doc.renewalDate
                                  ? new Date(
                                      doc.renewalDate
                                    ).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })
                                  : "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell p-2 md:p-4">
                              {doc.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {doc.tags.map((tag, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell p-2 md:p-4">
                              {doc.email || "-"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell p-2 md:p-4">
                              {doc.mobile || "-"}
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
                                  {userRole?.toLowerCase() === "admin" && (
                                    <>
                                      <DropdownMenuItem
                                        className="cursor-pointer text-emerald-600"
                                        onClick={() => handleApprove(doc.id)}
                                      >
                                        <Check className="h-4 w-4 mr-2" />
                                        Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="cursor-pointer text-red-600"
                                        onClick={() => handleReject(doc.id)}
                                      >
                                        <XIcon className="h-4 w-4 mr-2" />
                                        Reject
                                      </DropdownMenuItem>
                                    </>
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
                            {searchTerm ? (
                              <>No documents found matching your criteria.</>
                            ) : (
                              <>
                                <div className="flex flex-col items-center justify-center py-8">
                                  <FileText className="h-12 w-12 text-gray-300 mb-4" />
                                  <p className="mb-4">
                                    No documents pending approval.
                                  </p>
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
            {filteredDocuments.length > 0 ? (
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
                          {userRole === "admin" && (
                            <>
                              <DropdownMenuItem
                                className="cursor-pointer text-emerald-600"
                                onClick={() => handleApprove(doc.id)}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-red-600"
                                onClick={() => handleReject(doc.id)}
                              >
                                <XIcon className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="mb-4 text-gray-500">
                    {searchTerm
                      ? "No documents found matching your criteria."
                      : "No documents pending approval."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
