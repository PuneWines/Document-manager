"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useDocuments, type DocumentType } from "@/components/document-context";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

export default function AddDocument() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { addDocument } = useDocuments();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
    setIsLoading(false);
  }, [isLoggedIn, router]);

  const [multipleFiles, setMultipleFiles] = useState<
    Array<{
      id: number;
      name: string;
      type: string;
      documentType: DocumentType;
      company: string;
      file: File | null;
      tags: string;
      entityName: string;
      email: string;
      phoneNumber: string;
      needsRenewal: boolean;
      renewalDate: string;
    }>
  >([
    {
      id: 1,
      name: "",
      type: "",
      documentType: "Personal",
      company: "",
      file: null,
      tags: "",
      entityName: "",
      email: "",
      phoneNumber: "",
      needsRenewal: false,
      renewalDate: "",
    },
  ]);

  const handleMultipleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.target.files && e.target.files[0]) {
      const updatedFiles = [...multipleFiles];
      updatedFiles[index] = {
        ...updatedFiles[index],
        file: e.target.files[0],
      };
      setMultipleFiles(updatedFiles);

      const fileInfoElement = document.getElementById(`file-info-${index}`);
      if (fileInfoElement) {
        fileInfoElement.textContent = `Selected: ${e.target.files[0].name} (${(
          e.target.files[0].size / 1024
        ).toFixed(1)} KB)`;
      }
    }
  };

  const handleMultipleInputChange = (
    index: number,
    field:
      | "name"
      | "type"
      | "documentType"
      | "company"
      | "tags"
      | "entityName"
      | "email"
      | "phoneNumber"
      | "renewalDate",
    value: string
  ) => {
    const updatedFiles = [...multipleFiles];
    updatedFiles[index] = {
      ...updatedFiles[index],
      [field]: value,
    };
    setMultipleFiles(updatedFiles);
  };

  const handleRenewalToggle = (index: number, value: boolean) => {
    const updatedFiles = [...multipleFiles];
    updatedFiles[index] = {
      ...updatedFiles[index],
      needsRenewal: value,
    };
    setMultipleFiles(updatedFiles);
  };

  const addFileRow = () => {
    setMultipleFiles([
      ...multipleFiles,
      {
        id: Date.now(),
        name: "",
        type: "",
        documentType: "Personal",
        company: "",
        file: null,
        tags: "",
        entityName: "",
        email: "",
        phoneNumber: "",
        needsRenewal: false,
        renewalDate: "",
      },
    ]);
  };

  const removeFileRow = (id: number) => {
    if (multipleFiles.length > 1) {
      setMultipleFiles(multipleFiles.filter((file) => file.id !== id));
    }
  };

  const getSerialPrefix = (documentType: DocumentType): string => {
    switch (documentType) {
      case "Personal":
        return "PN";
      case "Company":
        return "CN";
      case "Director":
        return "DN";
      default:
        return "DN";
    }
  };

  // Function to upload file to Google Drive
  const uploadFileToGoogleDrive = async (file: File): Promise<string> => {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec";
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderId", "1_GCMRvzAsvU5xXMoqzXh-Tdik-EXBu6c");
    formData.append("action", "uploadFile");
    
    try {
      const response = await fetch(scriptUrl, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.fileUrl || result.directUrl || "";
      } else {
        throw new Error(result.error || "File upload failed");
      }
    } catch (error) {
      console.error("File upload error:", error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for required fields including email and phone
    const invalidFiles = multipleFiles.filter(
      (file) => !file.name || !file.type || !file.documentType || !file.file || !file.email || !file.phoneNumber
    );
    if (invalidFiles.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields for all documents including email and phone number.",
        variant: "destructive",
      });
      return;
    }

    const invalidRenewalDates = multipleFiles.filter(
      (file) => file.needsRenewal && !file.renewalDate
    );
    if (invalidRenewalDates.length > 0) {
      toast({
        title: "Validation Error",
        description:
          "Please provide a renewal date for documents that need renewal.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = multipleFiles.filter(
      (file) => !emailRegex.test(file.email)
    );
    if (invalidEmails.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please enter valid email addresses for all documents.",
        variant: "destructive",
      });
      return;
    }

    // Phone number validation (basic validation for numeric characters)
    const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
    const invalidPhones = multipleFiles.filter(
      (file) => !phoneRegex.test(file.phoneNumber.trim()) || file.phoneNumber.trim().length < 10
    );
    if (invalidPhones.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please enter valid phone numbers (at least 10 digits) for all documents.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const scriptUrl =
        "https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec";

      // First, fetch existing data to determine the next serial number for each category
      const fetchResponse = await fetch(
        `${scriptUrl}?sheet=Documents&action=fetch`
      );
      
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch data: ${fetchResponse.status}`);
      }

      const existingData = await fetchResponse.json();
      
      if (!existingData.success) {
        throw new Error(existingData.error || "Failed to fetch document data");
      }

      let lastPersonalNumber = 0;
      let lastCompanyNumber = 0;
      let lastDirectorNumber = 0;

      if (existingData.data && existingData.data.length > 1) {
        for (let i = 1; i < existingData.data.length; i++) {
          const serial = existingData.data[i][1];
          if (serial && typeof serial === "string") {
            if (serial.startsWith("PN-")) {
              const num = parseInt(serial.split("-")[1]);
              if (!isNaN(num) && num > lastPersonalNumber) {
                lastPersonalNumber = num;
              }
            } else if (serial.startsWith("CN-")) {
              const num = parseInt(serial.split("-")[1]);
              if (!isNaN(num) && num > lastCompanyNumber) {
                lastCompanyNumber = num;
              }
            } else if (serial.startsWith("DN-")) {
              const num = parseInt(serial.split("-")[1]);
              if (!isNaN(num) && num > lastDirectorNumber) {
                lastDirectorNumber = num;
              }
            }
          }
        }
      }

      // Prepare data with generated serial numbers and upload files
      const submissionData = await Promise.all(multipleFiles.map(async (file) => {
        let serialNumber = "";
        const prefix = getSerialPrefix(file.documentType);
        
        if (file.documentType === "Personal") {
          lastPersonalNumber++;
          serialNumber = `${prefix}-${String(lastPersonalNumber).padStart(3, "0")}`;
        } else if (file.documentType === "Company") {
          lastCompanyNumber++;
          serialNumber = `${prefix}-${String(lastCompanyNumber).padStart(3, "0")}`;
        } else if (file.documentType === "Director") {
          lastDirectorNumber++;
          serialNumber = `${prefix}-${String(lastDirectorNumber).padStart(3, "0")}`;
        }

        // Upload file to Google Drive and get the link
        let fileLink = "";
        if (file.file) {
          try {
            fileLink = await uploadFileToGoogleDrive(file.file);
          } catch (error) {
            console.error(`Failed to upload file ${file.name}:`, error);
            // You can decide whether to continue or stop here
            // For now, we'll continue with an empty file link
            fileLink = "";
          }
        }

        // Return row data - ensure email and phone are included
        return [
          new Date().toISOString(),           // Column A: Date
          serialNumber,                       // Column B: Serial Number
          file.name,                          // Column C: Document Name
          file.type,                          // Column D: Document Type
          file.documentType,                  // Column E: Category
          file.company,                       // Column F: Company/Department
          file.tags,                          // Column G: Tags
          file.entityName,                    // Column H: Entity Name
          file.needsRenewal ? "Yes" : "No",   // Column I: Needs Renewal
          file.renewalDate || "",             // Column J: Renewal Date
          `${(file.file?.size || 0) / 1024 / 1024} MB`, // Column K: File Size
          fileLink,                           // Column L: File Link
          file.email,                         // Column M: Email Address
          file.phoneNumber,                   // Column N: Phone Number
        ];
      }));

      // Submit each document to Google Sheets
      const serialNumbers: string[] = [];
      for (const rowData of submissionData) {
        const formData = new FormData();
        formData.append("sheetName", "Documents");
        formData.append("action", "insert");
        formData.append("rowData", JSON.stringify(rowData));

        const response = await fetch(scriptUrl, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result || !result.success) {
          throw new Error(result?.error || "Document submission failed");
        }
        serialNumbers.push(rowData[1]);
      }

      // Update local context
      multipleFiles.forEach((file, index) => {
        const serialNumber = submissionData[index][1];
        addDocument({
          serialNumber,
          name: file.name,
          type: file.type,
          documentType: file.documentType,
          company: file.company,
          tags: file.tags.split(",").map((tag) => tag.trim()),
          size: `${(file.file?.size || 0) / 1024 / 1024} MB`,
          entityName: file.entityName,
          needsRenewal: file.needsRenewal,
          renewalDate: file.renewalDate,
        });
      });

      toast({
        title: "Success",
        description: `Documents added successfully with serial numbers: ${serialNumbers.join(", ")}`,
      });

      // Reset form
      setMultipleFiles([{
        id: 1,
        name: "",
        type: "",
        documentType: "Personal",
        company: "",
        file: null,
        tags: "",
        entityName: "",
        email: "",
        phoneNumber: "",
        needsRenewal: false,
        renewalDate: "",
      }]);

      router.push("/documents");
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  const getEntityLabel = (documentType: DocumentType): string => {
    switch (documentType) {
      case "Personal":
        return "Person Name";
      case "Company":
        return "Company Name";
      case "Director":
        return "Director Name";
      default:
        return "Entity Name";
    }
  };

  const getEntityPlaceholder = (documentType: DocumentType): string => {
    switch (documentType) {
      case "Personal":
        return "Enter person name";
      case "Company":
        return "Enter company name";
      case "Director":
        return "Enter director name";
      default:
        return "Enter name";
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 pt-16 md:pt-8 max-w-[1600px] mx-auto">
      <Toaster />
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mr-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-emerald-800">
          Add New Documents
        </h1>
      </div>

      <div className="max-w-5xl mx-auto">
        <Card className="shadow-sm">
          <form onSubmit={handleSubmit}>
            <CardHeader className="bg-gray-50 border-b p-4 md:p-6">
              <CardTitle className="text-base md:text-lg text-emerald-800 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-emerald-600 flex-shrink-0" />
                Document Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4 md:p-6">
              {multipleFiles.map((fileItem, index) => (
                <div
                  key={fileItem.id}
                  className="p-3 md:p-4 border rounded-lg bg-gray-50 relative"
                >
                  <div className="absolute right-2 top-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFileRow(fileItem.id)}
                      disabled={multipleFiles.length === 1}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>

                  <h3 className="font-medium mb-3 md:mb-4 text-emerald-700 pr-8">
                    Document #{index + 1}
                  </h3>

                  {/* First row - Document basic info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${index}`} className="text-sm font-medium">
                        Document Name *
                      </Label>
                      <Input
                        id={`name-${index}`}
                        placeholder="Enter document name"
                        value={fileItem.name}
                        onChange={(e) =>
                          handleMultipleInputChange(
                            index,
                            "name",
                            e.target.value
                          )
                        }
                        required
                        className="border-gray-300 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`type-${index}`} className="text-sm font-medium">
                        Document Type *
                      </Label>
                      <Select
                        value={fileItem.type}
                        onValueChange={(value) =>
                          handleMultipleInputChange(index, "type", value)
                        }
                        required
                      >
                        <SelectTrigger
                          id={`type-${index}`}
                          className="border-gray-300 text-sm"
                        >
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="invoice">Invoice</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="report">Report</SelectItem>
                          <SelectItem value="presentation">
                            Presentation
                          </SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="plan">Plan</SelectItem>
                          <SelectItem value="tax">Tax Document</SelectItem>
                          <SelectItem value="resume">Resume</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`document-type-${index}`}
                        className="text-sm font-medium"
                      >
                        Category *
                      </Label>
                      <Select
                        value={fileItem.documentType}
                        onValueChange={(value: DocumentType) => {
                          const updatedFiles = [...multipleFiles];
                          updatedFiles[index] = {
                            ...updatedFiles[index],
                            documentType: value,
                            entityName: "",
                          };
                          setMultipleFiles(updatedFiles);
                        }}
                        required
                      >
                        <SelectTrigger
                          id={`document-type-${index}`}
                          className="border-gray-300 text-sm"
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Personal">Personal</SelectItem>
                          <SelectItem value="Company">Company</SelectItem>
                          <SelectItem value="Director">Director</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Second row - Additional info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="space-y-2">
                      <Label htmlFor={`company-${index}`} className="text-sm font-medium">
                        Company/Department
                      </Label>
                      <Input
                        id={`company-${index}`}
                        placeholder="Enter company or department"
                        value={fileItem.company}
                        onChange={(e) =>
                          handleMultipleInputChange(
                            index,
                            "company",
                            e.target.value
                          )
                        }
                        className="border-gray-300 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`tags-${index}`} className="text-sm font-medium">
                        Tags (comma separated)
                      </Label>
                      <Input
                        id={`tags-${index}`}
                        placeholder="Enter tags (e.g., important, finance, tax)"
                        value={fileItem.tags}
                        onChange={(e) =>
                          handleMultipleInputChange(
                            index,
                            "tags",
                            e.target.value
                          )
                        }
                        className="border-gray-300 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`entity-name-${index}`} className="text-sm font-medium">
                        {getEntityLabel(fileItem.documentType)}
                      </Label>
                      <Input
                        id={`entity-name-${index}`}
                        placeholder={getEntityPlaceholder(fileItem.documentType)}
                        value={fileItem.entityName}
                        onChange={(e) =>
                          handleMultipleInputChange(
                            index,
                            "entityName",
                            e.target.value
                          )
                        }
                        className="border-gray-300 text-sm"
                      />
                    </div>
                  </div>

                  {/* Third row - Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="space-y-2">
                      <Label htmlFor={`email-${index}`} className="text-sm font-medium flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-emerald-600" />
                        Email Address *
                      </Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        placeholder="Enter email address"
                        value={fileItem.email}
                        onChange={(e) =>
                          handleMultipleInputChange(
                            index,
                            "email",
                            e.target.value
                          )
                        }
                        required
                        className="border-gray-300 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`phone-${index}`} className="text-sm font-medium flex items-center">
                        <Phone className="h-4 w-4 mr-1 text-emerald-600" />
                        Phone Number *
                      </Label>
                      <Input
                        id={`phone-${index}`}
                        type="tel"
                        placeholder="Enter phone number"
                        value={fileItem.phoneNumber}
                        onChange={(e) =>
                          handleMultipleInputChange(
                            index,
                            "phoneNumber",
                            e.target.value
                          )
                        }
                        required
                        className="border-gray-300 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      {/* Empty div to maintain grid structure */}
                    </div>
                  </div>

                  {/* Renewal Section */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 text-amber-500" />
                        <Label
                          htmlFor={`needs-renewal-${index}`}
                          className="text-sm font-medium"
                        >
                          Document Needs Renewal
                        </Label>
                      </div>
                      <Switch
                        id={`needs-renewal-${index}`}
                        checked={fileItem.needsRenewal}
                        onCheckedChange={(checked) =>
                          handleRenewalToggle(index, checked)
                        }
                      />
                    </div>

                    {fileItem.needsRenewal && (
                      <div className="mt-3">
                        <Label
                          htmlFor={`renewal-date-${index}`}
                          className="text-sm font-medium"
                        >
                          Renewal Date *
                        </Label>
                        <Input
                          id={`renewal-date-${index}`}
                          type="date"
                          value={fileItem.renewalDate}
                          onChange={(e) =>
                            handleMultipleInputChange(
                              index,
                              "renewalDate",
                              e.target.value
                            )
                          }
                          className="border-gray-300 text-sm mt-1"
                          required={fileItem.needsRenewal}
                        />
                      </div>
                    )}
                  </div>

                  {/* File Upload Section */}
                  <div className="border-t pt-3 mt-3">
                    <div className="space-y-2">
                      <Label htmlFor={`file-${index}`} className="text-sm font-medium">
                        Upload File *
                      </Label>
                      <Input
                        id={`file-${index}`}
                        type="file"
                        onChange={(e) => handleMultipleFileChange(e, index)}
                        required
                        className="border-gray-300 text-sm"
                      />
                      {fileItem.file && (
                        <p
                          id={`file-info-${index}`}
                          className="text-xs text-gray-500 truncate"
                        >
                          Selected: {fileItem.file.name} (
                          {(fileItem.file.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addFileRow}
                className="w-full border-dashed border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-12"
              >
                <Plus className="mr-2 h-4 w-4 flex-shrink-0" /> Add Another
                Document
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 border-t bg-gray-50 p-4 md:p-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/")}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto order-1 sm:order-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4 flex-shrink-0" />
                    Upload Documents ({multipleFiles.length})
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}