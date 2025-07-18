"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
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
  Filter,
  Plus,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { EmailShareDialog } from "@/components/email-share-dialog"
import { WhatsAppShareDialog } from "@/components/whatsapp-share-dialog"
import { useAuth } from "@/components/auth-provider"
import { useDocuments, type DocumentType } from "@/components/document-context"

export default function DocumentsList() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { isLoggedIn } = useAuth()
  const { documents, getDocumentsByType } = useDocuments()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDocs, setSelectedDocs] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [shareMethod, setShareMethod] = useState<"email" | "whatsapp" | null>(null)
  const [mounted, setMounted] = useState(false)

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
    // Check if user is logged in
    if (!isLoggedIn) {
      router.push("/login")
    }
    setIsLoading(false)
    setMounted(true)

    // Set search term from URL if present
    const search = searchParams.get("search")
    if (search) {
      setSearchTerm(search)
    }
  }, [isLoggedIn, router, searchParams])

  // Reset selected docs when changing document type
  useEffect(() => {
    setSelectedDocs([])
  }, [params])

  // Don't render anything until we check auth and component is mounted
  if (isLoading || !mounted) {
    return null // The loading.tsx file will handle the loading state
  }

  // Don't render anything if not logged in
  if (!isLoggedIn) {
    return null
  }

  // Get document type from URL
  const typeParam = params.type as string
  const isValidType = ["personal", "company", "director"].includes(typeParam?.toLowerCase())

  // Format document type for display and filtering
  const formattedType = isValidType ? ((typeParam.charAt(0).toUpperCase() + typeParam.slice(1)) as DocumentType["documentType"]) : null

  // Get documents based on type
  const documentsList = formattedType ? getDocumentsByType(formattedType) : documents

  // Filter documents based on search term
  const filteredDocuments = documentsList.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const selectedDocuments = documents.filter((doc) => selectedDocs.includes(doc.id))

  const handleCheckboxChange = (id: number) => {
    setSelectedDocs((prev) => (prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]))
  }

  const handleSelectAll = () => {
    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([])
    } else {
      setSelectedDocs(filteredDocuments.map((doc) => doc.id))
    }
  }

  const handleShareEmail = () => {
    if (!emailData.to || !emailData.name) return

    // In a real app, you would implement the email sharing functionality
    console.log(`Sharing documents ${selectedDocs.join(", ")} via email to ${emailData.to}`)
    console.log("Recipient name:", emailData.name)
    console.log("Email subject:", emailData.subject)
    console.log("Email message:", emailData.message)

    toast({
      title: "Documents shared via email",
      description: `${selectedDocs.length} documents have been shared to ${emailData.name} (${emailData.to})`,
    })

    setEmailData({ to: "", name: "", subject: "", message: "" })
    setShareMethod(null)
  }

  const handleShareWhatsApp = () => {
    if (!whatsappNumber) return

    // In a real app, you would implement the WhatsApp sharing functionality
    const selectedDocNames = documents
      .filter((doc) => selectedDocs.includes(doc.id))
      .map((doc) => doc.name)
      .join(", ")

    const text = `I'm sharing these documents with you: ${selectedDocNames}`

    // In a real implementation, you would use the WhatsApp Business API
    // For now, we'll just simulate opening WhatsApp with the phone number
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, "_blank")

    toast({
      title: "Opening WhatsApp",
      description: `${selectedDocs.length} documents are being shared via WhatsApp to +${whatsappNumber}`,
    })

    setWhatsappNumber("")
    setShareMethod(null)
  }

  // Get title and icon based on document type
  let pageTitle = "All Documents"
  let PageIcon = FileText
  let iconColor = "text-emerald-600"
  let bgColor = "bg-emerald-50"
  let borderColor = "border-emerald-200"

  if (formattedType === "Personal") {
    pageTitle = "Person Document"
    PageIcon = User
    iconColor = "text-emerald-600"
    bgColor = "bg-emerald-50"
    borderColor = "border-emerald-200"
  } else if (formattedType === "Company") {
    pageTitle = "Company Documents"
    PageIcon = Briefcase
    iconColor = "text-blue-600"
    bgColor = "bg-blue-50"
    borderColor = "border-blue-200"
  } else if (formattedType === "Director") {
    pageTitle = "Director Documents"
    PageIcon = Users
    iconColor = "text-amber-600"
    bgColor = "bg-amber-50"
    borderColor = "border-amber-200"
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
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-emerald-800 flex items-center">
            <PageIcon className={`h-6 w-6 mr-2 ${iconColor}`} />
            {pageTitle}
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
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              {selectedDocs.length === filteredDocuments.length ? "Deselect All" : "Select All"}
            </Button>

            <div className="flex gap-2 flex-1 sm:flex-none">
              <Button
                size="sm"
                disabled={selectedDocs.length === 0}
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
                disabled={selectedDocs.length === 0}
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

      {/* Document Type Summary Card */}
      <Card className={`shadow-sm mb-6 ${bgColor} border ${borderColor}`}>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${bgColor} mr-4`}>
                <PageIcon className={`h-8 w-8 ${iconColor}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{pageTitle}</h2>
                <p className="text-sm text-gray-600">
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-white" asChild>
                <Link href="/documents/add">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-white">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/documents/personal" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2 text-emerald-500" />
                      Personal Documents
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/documents/company" className="cursor-pointer">
                      <Briefcase className="h-4 w-4 mr-2 text-blue-500" />
                      Company Documents
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/documents/director" className="cursor-pointer">
                      <Users className="h-4 w-4 mr-2 text-amber-500" />
                      Director Documents
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/documents" className="cursor-pointer">
                      <FileText className="h-4 w-4 mr-2 text-gray-500" />
                      All Documents
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="bg-gray-50 border-b p-4 md:p-6">
          <CardTitle className="text-base md:text-lg text-emerald-800 flex items-center">
            <PageIcon className={`h-5 w-5 mr-2 ${iconColor} flex-shrink-0`} />
            {pageTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-12 p-2 md:p-4">
                    <Checkbox
                      checked={selectedDocs.length > 0 && selectedDocs.length === filteredDocuments.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="p-2 md:p-4">Serial No</TableHead>
                  <TableHead className="p-2 md:p-4">Document Name</TableHead>
                  <TableHead className="hidden md:table-cell p-2 md:p-4">Document Type</TableHead>
                  <TableHead className="hidden md:table-cell p-2 md:p-4">Category</TableHead>
                  <TableHead className="hidden md:table-cell p-2 md:p-4">Company/Department</TableHead>
                  <TableHead className="hidden md:table-cell p-2 md:p-4">Name</TableHead>
                  <TableHead className="hidden lg:table-cell p-2 md:p-4">Timestamp</TableHead>
                  <TableHead className="hidden md:table-cell p-2 md:p-4">Renewal</TableHead>
                  <TableHead className="hidden lg:table-cell p-2 md:p-4">Tags</TableHead>
                  <TableHead className="hidden md:table-cell p-2 md:p-4">Image</TableHead>
                  <TableHead className="hidden md:table-cell p-2 md:p-4">Email</TableHead>
                  <TableHead className="hidden md:table-cell p-2 md:p-4">Mobile</TableHead>
                  <TableHead className="text-right p-2 md:p-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc, index) => (
                    <TableRow key={doc.id} className="hover:bg-gray-50">
                      <TableCell className="p-2 md:p-4">
                        <Checkbox
                          checked={selectedDocs.includes(doc.id)}
                          onCheckedChange={() => handleCheckboxChange(doc.id)}
                        />
                      </TableCell>
                      <TableCell className="p-2 md:p-4">{index + 1}</TableCell>
                      <TableCell className="p-2 md:p-4">
                        <div className="flex items-center min-w-0">
                          {doc.documentType === "Personal" ? (
                            <User className="h-4 w-4 mr-2 text-emerald-500 flex-shrink-0" />
                          ) : doc.documentType === "Company" ? (
                            <Briefcase className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                          ) : (
                            <Users className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium truncate text-sm md:text-base">{doc.name}</div>
                            <div className="md:hidden text-xs text-gray-500 truncate">
                              {doc.type} • {doc.company}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-2 md:p-4">{doc.type}</TableCell>
                      <TableCell className="hidden md:table-cell p-2 md:p-4">
                        <Badge
                          className={`${
                            doc.documentType === "Personal"
                              ? "bg-emerald-100 text-emerald-800"
                              : doc.documentType === "Company"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {doc.documentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-2 md:p-4">
                        {doc.companyName || doc.company || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-2 md:p-4">
                        {doc.personName || doc.directorName || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-2 md:p-4">{doc.date}</TableCell>
                      <TableCell className="hidden md:table-cell p-2 md:p-4">
                        {doc.needsRenewal ? (
                          <div className="flex items-center">
                            <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" />
                              <span>{doc.renewalDate || "Needs Renewal"}</span>
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
                      <TableCell className="hidden md:table-cell p-2 md:p-4">
                        {doc.imageUrl ? (
                          <img
                            src={doc.imageUrl}
                            alt={doc.name}
                            className="h-10 w-10 object-cover rounded"
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-2 md:p-4">{doc.email || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell p-2 md:p-4">{doc.mobile || "-"}</TableCell>
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
                    <TableCell colSpan={14} className="text-center py-8 text-gray-500">
                      {searchTerm ? (
                        <>No documents found matching your search.</>
                      ) : (
                        <>
                          <div className="flex flex-col items-center justify-center py-8">
                            <PageIcon className={`h-12 w-12 ${iconColor} mb-4 opacity-50`} />
                            <p className="mb-4">No {formattedType?.toLowerCase()} documents found.</p>
                            <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
                              <Link href="/documents/add">
                                <Plus className="h-4 w-4 mr-2" />
                                Add New Document
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

      {/* Mobile Document List (for very small screens) */}
      <div className="md:hidden mt-4">
        {filteredDocuments.length > 0 && (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="shadow-sm overflow-hidden">
                <div className="p-3 border-l-4 border-l-emerald-500 flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <Checkbox
                      checked={selectedDocs.includes(doc.id)}
                      onCheckedChange={() => handleCheckboxChange(doc.id)}
                      className="mr-3"
                    />
                    {doc.documentType === "Personal" ? (
                      <User className="h-5 w-5 mr-2 text-emerald-500 flex-shrink-0" />
                    ) : doc.documentType === "Company" ? (
                      <Briefcase className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" />
                    ) : (
                      <Users className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate text-sm">{doc.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {doc.type} • {doc.date}
                      </div>
                      {doc.needsRenewal && (
                        <Badge className="mt-1 bg-amber-100 text-amber-800 text-xs flex items-center gap-1 w-fit">
                          <RefreshCw className="h-3 w-3" />
                          <span>Renewal: {doc.renewalDate || "Required"}</span>
                        </Badge>
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