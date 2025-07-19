"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { EmailShareDialog } from "@/components/email-share-dialog"
import { WhatsAppShareDialog } from "@/components/whatsapp-share-dialog"
import { useAuth } from "@/components/auth-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Updated Document interface
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

// Updated DocumentFilter type to only include "All" and "Renewal"
type DocumentFilter = "All" | "Renewal";

// Date formatting utility function
const formatDateToDDMMYYYY = (dateString: string): string => {
  if (!dateString) return "";
  
  try {
    // Handle various date formats
    let date: Date;
    
    // Check if it's already in DD/MM/YYYY format
    if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      return dateString;
    }
    
    // Check if it's in MM/DD/YYYY format
    if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        // Assume MM/DD/YYYY and convert to DD/MM/YYYY
        date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
      } else {
        date = new Date(dateString);
      }
    } else {
      // Try to parse as a standard date
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original if can't parse
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Return original string if formatting fails
  }
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Loading Documents</h3>
        <p className="text-sm text-gray-500">Please wait while we fetch your documents...</p>
      </div>
    </div>
  </div>
)

export default function DocumentsList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoggedIn } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocs, setSelectedDocs] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [shareMethod, setShareMethod] = useState<"email" | "whatsapp" | null>(null)
  const [mounted, setMounted] = useState(false)
  // Changed default filter to "Renewal"
  const [currentFilter, setCurrentFilter] = useState<DocumentFilter>("Renewal")

  // Email sharing state
  const [emailData, setEmailData] = useState({
    to: "",
    name: "",
    subject: "",
    message: "",
  })

  // WhatsApp sharing state
  const [whatsappNumber, setWhatsappNumber] = useState("")

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    setMounted(true)

    const search = searchParams.get("search")
    if (search) {
      setSearchTerm(search)
    }

    const filter = searchParams.get("filter") as DocumentFilter
    // Updated filter validation to only allow "All" and "Renewal"
    if (filter && ["All", "Renewal"].includes(filter)) {
      setCurrentFilter(filter)
    } else {
      // If no valid filter in URL, default to "Renewal"
      setCurrentFilter("Renewal")
    }

    fetchDocuments()
  }, [isLoggedIn, router, searchParams])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec?sheet=Documents"
      )
      const data = await response.json()

      if (data.success && data.data) {
        const docs = data.data.slice(1).map((doc: any[], index: number) => ({
          id: index + 1,
          timestamp: formatDateToDDMMYYYY(doc[0] || ""),
          serialNo: doc[1] || "",
          name: doc[2] || "",
          documentType: doc[3] || "Personal",
          category: doc[4] || "",
          company: doc[5] || "",
          tags: doc[6] ? String(doc[6]).split(",").map((tag: string) => tag.trim()) : [],
          personName: doc[7] || "",
          needsRenewal: doc[8] === "TRUE" || doc[8] === "Yes" || false,
          renewalDate: formatDateToDDMMYYYY(doc[9] || ""),
          imageUrl: doc[10] || "",
          email: doc[12] || "",
          mobile: doc[13] ? String(doc[13]) : "",
        }))

        setDocuments(docs)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch documents",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading spinner while initializing or not logged in
  if (!mounted || !isLoggedIn) {
    return <LoadingSpinner />
  }

  const filteredDocuments = documents.filter(
    (doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(doc.email).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(doc.mobile).toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.serialNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilter =
        currentFilter === "All" ||
        (currentFilter === "Renewal" && doc.needsRenewal);

      return matchesSearch && matchesFilter;
    }
  )

  const selectedDocuments = documents.filter((doc) => selectedDocs.includes(doc.id))

  const handleCheckboxChange = (id: number) => {
    setSelectedDocs((prev) => (prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]))
  }

  const handleShareEmail = () => {
    if (!emailData.to || !emailData.name) return

    console.log(`Sharing documents ${selectedDocs.join(", ")} via email to ${emailData.to}`)
    toast({
      title: "Documents shared via email",
      description: `${selectedDocs.length} documents have been shared to ${emailData.name} (${emailData.to})`,
    })

    setEmailData({ to: "", name: "", subject: "", message: "" })
    setShareMethod(null)
  }

  const handleShareWhatsApp = () => {
    if (!whatsappNumber) return

    const selectedDocNames = documents
      .filter((doc) => selectedDocs.includes(doc.id))
      .map((doc) => doc.name)
      .join(", ")

    const text = `I'm sharing these documents with you: ${selectedDocNames}`
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`

    window.open(whatsappUrl, "_blank")

    toast({
      title: "Opening WhatsApp",
      description: `${selectedDocs.length} documents are being shared via WhatsApp to +${whatsappNumber}`,
    })

    setWhatsappNumber("")
    setShareMethod(null)
  }

  const handleFilterChange = (value: string) => {
    setCurrentFilter(value as DocumentFilter)
    // Update URL to reflect filter
    const newSearchParams = new URLSearchParams(searchParams.toString())
    if (value === "Renewal") {
      // Set "Renewal" as the default, so we can store it in URL
      newSearchParams.set("filter", value)
    } else if (value === "All") {
      newSearchParams.set("filter", value)
    }
    router.push(`?${newSearchParams.toString()}`)
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
            {currentFilter === "All" ? "All Documents" : "Documents Needing Renewal"}
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
            {/* Updated Filter Dropdown - Only "All" and "Needs Renewal" */}
            <Select onValueChange={handleFilterChange} value={currentFilter} disabled={isLoading}>
              <SelectTrigger className="hidden w-[180px] border-gray-300 focus:ring-emerald-500">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                {/* <SelectItem value="All">All Documents</SelectItem> */}
                <SelectItem  value="Renewal">Needs Renewal</SelectItem>
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

      {/* Show loading spinner when fetching data */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Card className="shadow-sm">
            <CardHeader className="bg-gray-50 border-b p-4 md:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg text-emerald-800 flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2 text-emerald-600 flex-shrink-0" />
                  {currentFilter === "All" ? "All Documents" : "Documents Needing Renewal"}
                </CardTitle>
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-white" asChild>
                  <Link href="/documents/add">
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New
                    </>
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-12 p-2 md:p-4">
                        <Checkbox
                          checked={selectedDocs.length > 0 && selectedDocs.length === filteredDocuments.length}
                          onCheckedChange={() => {
                            if (selectedDocs.length === filteredDocuments.length) {
                              setSelectedDocs([])
                            } else {
                              setSelectedDocs(filteredDocuments.map((doc) => doc.id))
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="p-2 md:p-4">Serial No</TableHead>
                      <TableHead className="p-2 md:p-4">Document Name</TableHead>
                      <TableHead className="hidden md:table-cell p-2 md:p-4">Category</TableHead>
                      <TableHead className="hidden md:table-cell p-2 md:p-4">Company/Dept</TableHead>
                      <TableHead className="hidden md:table-cell p-2 md:p-4">Name</TableHead>
                      <TableHead className="hidden lg:table-cell p-2 md:p-4">Timestamp</TableHead>
                      <TableHead className="hidden lg:table-cell p-2 md:p-4">Email</TableHead>
                      <TableHead className="hidden lg:table-cell p-2 md:p-4">Mobile</TableHead>
                      <TableHead className="hidden md:table-cell p-2 md:p-4">Renewal</TableHead>
                      <TableHead className="hidden lg:table-cell p-2 md:p-4">Tags</TableHead>
                      <TableHead className="hidden lg:table-cell p-2 md:p-4">Image</TableHead>
                      <TableHead className="text-right p-2 md:p-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-gray-50">
                          <TableCell className="p-2 md:p-4">
                            <Checkbox
                              checked={selectedDocs.includes(doc.id)}
                              onCheckedChange={() => handleCheckboxChange(doc.id)}
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
                                <div className="font-medium truncate text-sm md:text-base">{doc.name}</div>
                                <div className="md:hidden text-xs text-gray-500 truncate">
                                  {doc.serialNo} • {doc.category} • {doc.company}
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
                            {doc.timestamp || "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell p-2 md:p-4">{doc.email || '-'}</TableCell>
                          <TableCell className="hidden lg:table-cell p-2 md:p-4">{doc.mobile || '-'}</TableCell>
                          <TableCell className="hidden md:table-cell p-2 md:p-4">
                            {doc.needsRenewal ? (
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
                            {doc.imageUrl ? (
                              <a href={doc.imageUrl} target="_blank" rel="noopener noreferrer">
                                <ImageIcon className="h-5 w-5 text-blue-500 hover:text-blue-700" />
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right p-2 md:p-4">
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
                                <DropdownMenuItem className="cursor-pointer">
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  {doc.needsRenewal ? "Update Renewal" : "Set Renewal"}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
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
                        <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                          {searchTerm || currentFilter !== "All" ? (
                            <>No documents found matching your criteria.</>
                          ) : (
                            <>
                              <div className="flex flex-col items-center justify-center py-8">
                                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                                <p className="mb-4">No documents found.</p>
                                <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
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

          {/* Mobile Document List */}
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
                          <div className="font-medium truncate text-sm">{doc.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            Serial: {doc.serialNo || "N/A"} • {doc.category}
                          </div>
                          <div className="text-xs text-gray-500 truncate font-mono">
                            {doc.timestamp || "No Date"}
                          </div>
                          {doc.email && (
                            <div className="text-xs text-gray-500 truncate">{doc.email}</div>
                          )}
                          {doc.mobile && (
                            <div className="text-xs text-gray-500 truncate">{doc.mobile}</div>
                          )}
                          {doc.needsRenewal && (
                            <Badge className="mt-1 bg-amber-100 text-amber-800 text-xs flex items-center gap-1 w-fit">
                              <RefreshCw className="h-3 w-3" />
                              <span className="font-mono">
                                {doc.renewalDate || "Required"}
                              </span>
                            </Badge>
                          )}
                          {doc.imageUrl && (
                            <a href={doc.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center text-xs text-blue-500">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              View Image
                            </a>
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
                          <DropdownMenuItem className="cursor-pointer">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {doc.needsRenewal ? "Update Renewal" : "Set Renewal"}
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
        </>
      )}

      {/* Email Share Dialog */}
      <EmailShareDialog
        open={shareMethod === "email"}
        onOpenChange={(open) => !open && setShareMethod(null)}
        emailData={emailData}
        setEmailData={setEmailData}
        selectedDocuments={selectedDocuments}
        onShare={handleShareEmail}
      />

      {/* WhatsApp Share Dialog */}
      <WhatsAppShareDialog
        open={shareMethod === "whatsapp"}
        onOpenChange={(open) => !open && setShareMethod(null)}
        whatsappNumber={whatsappNumber}
        setWhatsappNumber={setWhatsappNumber}
        selectedDocuments={selectedDocuments}
        onShare={handleShareWhatsApp}
      />
    </div>
  )
}