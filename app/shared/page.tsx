"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail, Share2, Smartphone, User, Briefcase, Users } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { useDocuments } from "@/components/document-context"

export default function SharedPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const { getSharedDocuments } = useDocuments()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    if (!isLoggedIn) {
      router.push("/login")
    }
    setIsLoading(false)
  }, [isLoggedIn, router])

  // Don't render anything until we check auth
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

  const sharedDocuments = getSharedDocuments()

  return (
    <div className="p-4 sm:p-6 md:p-8 pt-16 md:pt-8 max-w-[1600px] mx-auto">
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
        <h1 className="text-xl md:text-2xl font-bold text-emerald-800">Shared Documents</h1>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-gray-50 border-b p-4 md:p-6">
          <CardTitle className="text-base md:text-lg text-emerald-800 flex items-center">
            <Share2 className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0" />
            Documents You've Shared
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {sharedDocuments.length > 0 ? (
              sharedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 hover:bg-gray-50 gap-3"
                >
                  <div className="flex items-center min-w-0">
                    {doc.documentType === "Personal" ? (
                      <User className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-500 mr-3 md:mr-4 flex-shrink-0" />
                    ) : doc.documentType === "Company" ? (
                      <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 mr-3 md:mr-4 flex-shrink-0" />
                    ) : (
                      <Users className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500 mr-3 md:mr-4 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm md:text-base">{doc.name}</p>
                      <p className="text-xs md:text-sm text-gray-500 truncate">
                        {doc.type} • {doc.size} • Shared on {doc.date}
                      </p>
                      <div className="flex items-center mt-1 flex-wrap gap-1">
                        <Badge
                          className={`text-xs mr-2 ${
                            doc.documentType === "Personal"
                              ? "bg-emerald-100 text-emerald-800"
                              : doc.documentType === "Company"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {doc.documentType}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs mr-2 ${
                            doc.sharedMethod === "email"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }`}
                        >
                          {doc.sharedMethod === "email" ? (
                            <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                          ) : (
                            <Smartphone className="h-3 w-3 mr-1 flex-shrink-0" />
                          )}
                          {doc.sharedMethod === "email" ? "Email" : "WhatsApp"}
                        </Badge>
                        <span className="text-xs text-gray-500 truncate">Shared with: {doc.sharedWith}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-11 sm:ml-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-700 border-gray-300 hover:bg-gray-100 w-full sm:w-auto"
                    >
                      Share Again
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Share2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>You haven't shared any documents yet.</p>
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" asChild>
                  <Link href="/documents">Share Documents</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
