"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  Plus,
  Share2,
  Upload,
  Clock,
  User,
  Briefcase,
  Users,
  ChevronRight,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { useDocuments } from "@/components/document-context"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const { getDocumentStats, getRecentDocuments, getSharedDocuments, getDocumentsNeedingRenewal } = useDocuments()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    if (!isLoggedIn) {
      router.push("/login")
    }
    setIsLoading(false)
  }, [isLoggedIn, router])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  // Don't render anything if not logged in
  if (!isLoggedIn) {
    return null
  }

  const stats = getDocumentStats()
  const recentDocuments = getRecentDocuments(4)
  const sharedDocuments = getSharedDocuments().slice(0, 4)
  const renewalDocuments = getDocumentsNeedingRenewal().slice(0, 4)

  // Calculate percentages for the document type distribution
  const totalDocs = stats.total || 1 // Avoid division by zero
  const personalPercentage = Math.round((stats.personal / totalDocs) * 100)
  const companyPercentage = Math.round((stats.company / totalDocs) * 100)
  const directorPercentage = Math.round((stats.director / totalDocs) * 100)
  const renewalPercentage = Math.round((stats.needsRenewal / totalDocs) * 100)

  // Get current date for greeting
  const currentHour = new Date().getHours()
  let greeting = "Good morning"
  if (currentHour >= 12 && currentHour < 18) {
    greeting = "Good afternoon"
  } else if (currentHour >= 18) {
    greeting = "Good evening"
  }

  // Format current date
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="p-4 sm:p-6 md:p-8 pt-16 md:pt-8 max-w-[1600px] mx-auto">
      {/* Header with greeting and date */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-emerald-800">{greeting}!</h1>
            <p className="text-gray-500 text-sm md:text-base">{currentDate}</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-500 w-full sm:w-auto shadow-sm" asChild>
            <Link href="/documents/add">
              <Plus className="mr-2 h-4 w-4" /> Add Document
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Total Documents</p>
                <h3 className="text-3xl font-bold text-emerald-800">{stats.total}</h3>
              </div>
              <div className="h-12 w-12 bg-emerald-200 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/documents"
                className="text-xs font-medium text-emerald-700 flex items-center hover:underline"
              >
                View all documents <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Recent Uploads</p>
                <h3 className="text-3xl font-bold text-blue-800">{stats.recent}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-blue-700" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-blue-600">In the last 7 days</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 mb-1">Shared Documents</p>
                <h3 className="text-3xl font-bold text-amber-800">{stats.shared}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-200 rounded-full flex items-center justify-center">
                <Share2 className="h-6 w-6 text-amber-700" />
              </div>
            </div>
            <div className="mt-4">
              <Link href="/shared" className="text-xs font-medium text-amber-700 flex items-center hover:underline">
                View shared documents <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-600 mb-1">Need Renewal</p>
                <h3 className="text-3xl font-bold text-rose-800">{stats.needsRenewal}</h3>
              </div>
              <div className="h-12 w-12 bg-rose-200 rounded-full flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-rose-700" />
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/documents/renewal"
                className="text-xs font-medium text-rose-700 flex items-center hover:underline"
              >
                View renewal documents <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Distribution and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Document Distribution */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg md:text-xl text-emerald-800 flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-emerald-600" />
                Document Distribution
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center">
                    <User className="h-4 w-4 mr-1 text-emerald-600" /> Personal
                  </span>
                  <span className="font-semibold">{personalPercentage}%</span>
                </div>
                <Progress
                  value={personalPercentage}
                  className="h-2 bg-gray-100"
                  indicatorClassName="bg-gradient-to-r from-emerald-400 to-emerald-600"
                />
                <p className="text-xs text-gray-500 mt-1">{stats.personal} documents</p>
              </div>

              <div className="flex flex-col space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center">
                    <Briefcase className="h-4 w-4 mr-1 text-blue-600" /> Company
                  </span>
                  <span className="font-semibold">{companyPercentage}%</span>
                </div>
                <Progress
                  value={companyPercentage}
                  className="h-2 bg-gray-100"
                  indicatorClassName="bg-gradient-to-r from-blue-400 to-blue-600"
                />
                <p className="text-xs text-gray-500 mt-1">{stats.company} documents</p>
              </div>

              <div className="flex flex-col space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center">
                    <Users className="h-4 w-4 mr-1 text-amber-600" /> Director
                  </span>
                  <span className="font-semibold">{directorPercentage}%</span>
                </div>
                <Progress
                  value={directorPercentage}
                  className="h-2 bg-gray-100"
                  indicatorClassName="bg-gradient-to-r from-amber-400 to-amber-600"
                />
                <p className="text-xs text-gray-500 mt-1">{stats.director} documents</p>
              </div>

              <div className="flex flex-col space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center">
                    <RefreshCw className="h-4 w-4 mr-1 text-rose-600" /> Renewal
                  </span>
                  <span className="font-semibold">{renewalPercentage}%</span>
                </div>
                <Progress
                  value={renewalPercentage}
                  className="h-2 bg-gray-100"
                  indicatorClassName="bg-gradient-to-r from-rose-400 to-rose-600"
                />
                <p className="text-xs text-gray-500 mt-1">{stats.needsRenewal} documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg md:text-xl text-emerald-800 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-emerald-600" />
                Recent Activity
              </CardTitle>
              <Link href="/documents" className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center min-w-0">
                    <div
                      className={`mr-3 p-2 rounded-full flex-shrink-0 ${
                        doc.documentType === "Personal"
                          ? "bg-emerald-100"
                          : doc.documentType === "Company"
                            ? "bg-blue-100"
                            : "bg-amber-100"
                      }`}
                    >
                      {doc.documentType === "Personal" ? (
                        <User
                          className={`h-5 w-5 ${
                            doc.documentType === "Personal"
                              ? "text-emerald-600"
                              : doc.documentType === "Company"
                                ? "text-blue-600"
                                : "text-amber-600"
                          }`}
                        />
                      ) : doc.documentType === "Company" ? (
                        <Briefcase
                          className={`h-5 w-5 ${
                            doc.documentType === "Personal"
                              ? "text-emerald-600"
                              : doc.documentType === "Company"
                                ? "text-blue-600"
                                : "text-amber-600"
                          }`}
                        />
                      ) : (
                        <Users
                          className={`h-5 w-5 ${
                            doc.documentType === "Personal"
                              ? "text-emerald-600"
                              : doc.documentType === "Company"
                                ? "text-blue-600"
                                : "text-amber-600"
                          }`}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm md:text-base">{doc.name}</p>
                      <div className="flex items-center mt-1">
                        <Badge
                          className={`mr-2 text-xs ${
                            doc.documentType === "Personal"
                              ? "bg-emerald-100 text-emerald-800"
                              : doc.documentType === "Company"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {doc.documentType}
                        </Badge>
                        <span className="text-xs text-gray-500">{doc.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-xs md:text-sm text-gray-500 ml-2 flex-shrink-0">{doc.date}</p>
                    {doc.needsRenewal && (
                      <Badge className="mt-1 bg-rose-100 text-rose-800 text-xs">Needs Renewal</Badge>
                    )}
                  </div>
                </div>
              ))}
              {recentDocuments.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No recent documents found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Renewal and Shared Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Renewal Documents */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg md:text-xl text-emerald-800 flex items-center">
                <RefreshCw className="h-5 w-5 mr-2 text-rose-600" />
                Documents Needing Renewal
              </CardTitle>
              <Link
                href="/documents?renewal=true"
                className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center"
              >
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {renewalDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center min-w-0">
                    <div
                      className={`mr-3 p-2 rounded-full flex-shrink-0 ${
                        doc.documentType === "Personal"
                          ? "bg-emerald-100"
                          : doc.documentType === "Company"
                            ? "bg-blue-100"
                            : "bg-amber-100"
                      }`}
                    >
                      {doc.documentType === "Personal" ? (
                        <User className="h-5 w-5 text-emerald-600" />
                      ) : doc.documentType === "Company" ? (
                        <Briefcase className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Users className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm md:text-base">{doc.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3 text-rose-500" />
                        <span className="text-xs text-rose-600 font-medium">{doc.renewalDate || "Needs Renewal"}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    Renew
                  </Button>
                </div>
              ))}
              {renewalDocuments.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-emerald-300" />
                  <p>No documents need renewal.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shared Documents */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg md:text-xl text-emerald-800 flex items-center">
                <Share2 className="h-5 w-5 mr-2 text-amber-600" />
                Recently Shared
              </CardTitle>
              <Link href="/shared" className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {sharedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center min-w-0">
                    <div className="mr-3 p-2 rounded-full bg-amber-100 flex-shrink-0">
                      <Share2 className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm md:text-base">{doc.name}</p>
                      <div className="flex items-center mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs mr-2 ${
                            doc.sharedMethod === "email"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }`}
                        >
                          {doc.sharedMethod === "email" ? "Email" : "WhatsApp"}
                        </Badge>
                        <span className="text-xs text-gray-500 truncate">
                          Shared with: {doc.sharedWith?.substring(0, 15)}
                          {doc.sharedWith && doc.sharedWith.length > 15 ? "..." : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    Share Again
                  </Button>
                </div>
              ))}
              {sharedDocuments.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <Share2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No shared documents found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Activity Summary */}
      <Card className="shadow-sm mb-6">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-lg md:text-xl text-emerald-800 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-emerald-600" />
            Document Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-emerald-700">Total Documents</h3>
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-800">{stats.total}</p>
              <div className="mt-2 flex items-center text-xs text-emerald-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>Growing collection</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-700">Recent Uploads</h3>
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-800">{stats.recent}</p>
              <p className="text-xs text-blue-600 mt-2">Last 7 days</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-amber-700">Shared Documents</h3>
                <Share2 className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-800">{stats.shared}</p>
              <div className="mt-2 flex items-center text-xs text-amber-600">
                <span>Collaboration active</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-lg border border-rose-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-rose-700">Need Renewal</h3>
                <RefreshCw className="h-5 w-5 text-rose-600" />
              </div>
              <p className="text-2xl font-bold text-rose-800">{stats.needsRenewal}</p>
              <div className="mt-2 flex items-center text-xs text-rose-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>Requires attention</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-purple-700">Document Types</h3>
                <div className="flex space-x-1">
                  <User className="h-4 w-4 text-emerald-600" />
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <Users className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-800">3</p>
              <p className="text-xs text-purple-600 mt-2">Categories</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-lg md:text-xl text-emerald-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-auto py-6 bg-emerald-600 hover:bg-emerald-700" asChild>
              <Link href="/documents/add" className="flex flex-col items-center text-center">
                <Upload className="h-6 w-6 mb-2" />
                <span className="font-medium">Upload Document</span>
                <span className="text-xs mt-1 text-emerald-100">Add a new document</span>
              </Link>
            </Button>

            <Button className="h-auto py-6 bg-blue-600 hover:bg-blue-700" asChild>
              <Link href="/documents" className="flex flex-col items-center text-center">
                <FileText className="h-6 w-6 mb-2" />
                <span className="font-medium">View All Documents</span>
                <span className="text-xs mt-1 text-blue-100">Browse your collection</span>
              </Link>
            </Button>

            <Button className="h-auto py-6 bg-amber-600 hover:bg-amber-700" asChild>
              <Link href="/shared" className="flex flex-col items-center text-center">
                <Share2 className="h-6 w-6 mb-2" />
                <span className="font-medium">Shared Documents</span>
                <span className="text-xs mt-1 text-amber-100">View shared items</span>
              </Link>
            </Button>

            <Button className="h-auto py-6 bg-rose-600 hover:bg-rose-700" asChild>
              <Link href="/documents/renewal" className="flex flex-col items-center text-center">
                <RefreshCw className="h-6 w-6 mb-2" />
                <span className="font-medium">Renewal Documents</span>
                <span className="text-xs mt-1 text-rose-100">Manage renewals</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
