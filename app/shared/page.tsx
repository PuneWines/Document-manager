"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Mail,
  Share2,
  Smartphone,
  User,
  Briefcase,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";

interface SharedDocument {
  id: string;
  timestamp: string;
  recipientName: string;
  documentName: string;
  documentType: string;
  category: string;
  serialNo: string;
  sourceSheet: string;
  shareMethod: string;
  email: string; // Add this line
  imageUrl?: string;
}

export default function SharedPage() {
  const router = useRouter();
  const { isLoggedIn, userRole, userName } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<SharedDocument[]>(
    []
  );

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    const fetchSharedDocuments = async () => {
      try {
        // First check if user is admin by checking the Pass sheet
        let isAdmin = false;
        if (userName) {
          const passResponse = await fetch(
            `https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec?sheet=Pass`
          );
          
          if (passResponse.ok) {
            const passData = await passResponse.json();
            if (passData.success && passData.data) {
              // Check if the user exists in Pass sheet and is admin (column D index 3)
              const userRow = passData.data.find((row: any[]) => 
                row[0]?.toString().toLowerCase() === userName.toLowerCase()
              );
              
              if (userRow && userRow[3]?.toString().toLowerCase() === "admin") {
                isAdmin = true;
              }
            }
          }
        }

        // Then fetch shared documents
        const response = await fetch(
          `https://script.google.com/macros/s/AKfycbzpljoSoitZEZ8PX_6bC9cO-SKZN147LzCbD-ATNPeBC5Dc5PslEx20Uvn1DxuVhVB_/exec?sheet=Shared Documents`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch shared documents");
        }

        const data = await response.json();

        if (data.success && data.data) {
          const documents = data.data
            .slice(1)
            .map((row: any[], index: number) => {
              // Extract date in DD/MM/YYYY format (column A)
              const rawDate = row[0]?.toString() || "";
              let displayDate = rawDate;
              let dateForSorting: Date | null = null;

              // If date is in a different format, convert it to DD/MM/YYYY
              if (rawDate) {
                try {
                  // Handle cases where date might be in different formats
                  const dateObj = new Date(rawDate);
                  if (!isNaN(dateObj.getTime())) {
                    displayDate = dateObj.toLocaleDateString("en-GB"); // Formats to DD/MM/YYYY
                    dateForSorting = dateObj;
                  }
                } catch (e) {
                  console.error("Error parsing date:", e);
                }
              }

              return {
      id: `doc-${index}`,
      timestamp: displayDate,
      rawTimestamp: dateForSorting || new Date(0),
      recipientName: row[2] || "N/A",
      documentName: row[3] || "Unnamed Document",
      documentType: row[4] || "Personal",
      category: row[5] || "Uncategorized",
      serialNo: row[6] || "N/A",
      sourceSheet: row[8] || "Unknown",
      shareMethod: row[9] || "Email",
      email: row[1] || "No Email", // Add this line - column B is index 1
      imageUrl: row[7] || undefined,
    };
  })
  .sort((a, b) => b.rawTimestamp.getTime() - a.rawTimestamp.getTime());

          setSharedDocuments(documents);
          
          // For admin, show all documents without filtering
          if (isAdmin) {
            setFilteredDocuments(documents);
          } else {
            // For non-admin users, filter by recipientName (case insensitive)
            const userSpecificDocs = documents.filter(
              (doc) => doc.recipientName.toLowerCase().includes(userName?.toLowerCase() || "")
            );
            setFilteredDocuments(userSpecificDocs);
          }
        }
      } catch (error) {
        console.error("Error fetching shared documents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedDocuments();
  }, [isLoggedIn, router, userRole, userName]);

  // Don't render anything until we check auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Don't render anything if not logged in
  if (!isLoggedIn) {
    return null;
  }

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
        <h1 className="text-xl md:text-2xl font-bold text-emerald-800">
          Shared Documents
        </h1>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-gray-50 border-b p-4 md:p-6">
          <CardTitle className="text-base md:text-lg text-emerald-800 flex items-center">
            <Share2 className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0" />
            {userRole === "admin"
              ? "All Shared Documents"
              : "Your Shared Documents"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
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
                      <p className="font-medium truncate text-sm md:text-base">
                        {doc.documentName}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500 truncate">
                        {doc.category} • {doc.serialNo} • {doc.timestamp} •{" "}
                        {doc.recipientName}
                      </p>
                      <div className="flex items-center mt-1 flex-wrap gap-1">
                        <Badge
  className="bg-emerald-100 text-emerald-800 text-xs mr-2"
>
  <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
  {doc.email}
</Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs mr-2 ${
                            doc.shareMethod === "Email"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }`}
                        >
                          {doc.shareMethod === "Email" ? (
                            <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                          ) : (
                            <Smartphone className="h-3 w-3 mr-1 flex-shrink-0" />
                          )}
                          {doc.shareMethod}
                        </Badge>
                        {userRole === "admin" && (
                          <>
                            <span className="text-xs text-gray-500 truncate">
                              Shared with: {doc.recipientName} |
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              Source: {doc.sourceSheet}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {userRole === "admin" && (
                    <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-11 sm:ml-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-700 border-gray-300 hover:bg-gray-100 w-full sm:w-auto"
                        onClick={() => {
                          router.push(
                            `/documents?search=${encodeURIComponent(
                              doc.serialNo
                            )}`
                          );
                        }}
                      >
                        Share Again
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Share2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  {userRole === "admin"
                    ? "No shared documents found in the system."
                    : "You haven't shared any documents yet."}
                </p>
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  asChild
                >
                  <Link href="/documents">Share Documents</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}