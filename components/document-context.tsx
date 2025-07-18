"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type DocumentType = "Personal" | "Company" | "Director"

// Update the Document interface to include renewal information
export interface Document {
  id: number
  name: string
  type: string
  documentType: DocumentType
  company: string
  date: string
  tags: string[]
  size: string
  sharedWith?: string
  sharedMethod?: "email" | "whatsapp"
  personName?: string
  companyName?: string
  directorName?: string
  needsRenewal?: boolean
  renewalDate?: string
}

interface DocumentContextType {
  documents: Document[]
  addDocument: (document: Omit<Document, "id" | "date">) => void
  getDocumentsByType: (type: DocumentType) => Document[]
  getDocumentStats: () => {
    total: number
    personal: number
    company: number
    director: number
    recent: number
    shared: number
    needsRenewal: number
  }
  getRecentDocuments: (limit?: number) => Document[]
  getSharedDocuments: () => Document[]
  getDocumentsNeedingRenewal: () => Document[]
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

// Update some of the sample documents to include renewal information
const initialDocuments: Document[] = [
  {
    id: 1,
    name: "Invoice-May2023.pdf",
    type: "Invoice",
    documentType: "Company",
    company: "Acme Inc",
    date: "2023-05-15",
    tags: ["invoice", "important"],
    size: "1.2 MB",
    sharedWith: "john@example.com",
    sharedMethod: "email",
    companyName: "Acme Corporation",
    needsRenewal: true,
    renewalDate: "2024-05-15",
  },
  {
    id: 2,
    name: "Contract-2023.docx",
    type: "Contract",
    documentType: "Company",
    company: "XYZ Corp",
    date: "2023-04-20",
    tags: ["contract", "legal"],
    size: "2.5 MB",
    sharedWith: "+1234567890",
    sharedMethod: "whatsapp",
    companyName: "XYZ Corporation",
    needsRenewal: true,
    renewalDate: "2024-04-20",
  },
  {
    id: 3,
    name: "Presentation.pptx",
    type: "Presentation",
    documentType: "Director",
    company: "ABC Ltd",
    date: "2023-03-10",
    tags: ["presentation", "marketing"],
    size: "4.8 MB",
    sharedWith: "sarah@example.com",
    sharedMethod: "email",
    directorName: "Sarah Johnson",
    needsRenewal: false,
  },
  {
    id: 4,
    name: "Financial-Report.xlsx",
    type: "Report",
    documentType: "Director",
    company: "Finance Dept",
    date: "2023-02-28",
    tags: ["finance", "report"],
    size: "3.1 MB",
    sharedWith: "+9876543210",
    sharedMethod: "whatsapp",
    directorName: "Michael Chen",
    needsRenewal: false,
  },
  {
    id: 5,
    name: "Project-Proposal.pdf",
    type: "Proposal",
    documentType: "Personal",
    company: "Personal",
    date: "2023-01-15",
    tags: ["proposal", "project"],
    size: "1.8 MB",
    personName: "John Smith",
    needsRenewal: false,
  },
  {
    id: 6,
    name: "Meeting-Minutes.docx",
    type: "Document",
    documentType: "Company",
    company: "Team Meetings",
    date: "2023-06-05",
    tags: ["meeting", "notes"],
    size: "0.9 MB",
    companyName: "Team Alpha",
    needsRenewal: false,
  },
  {
    id: 7,
    name: "Product-Catalog.pdf",
    type: "Catalog",
    documentType: "Company",
    company: "Sales Dept",
    date: "2023-05-22",
    tags: ["catalog", "products"],
    size: "5.2 MB",
    companyName: "Sales Division",
    needsRenewal: false,
  },
  {
    id: 8,
    name: "Employee-Handbook.pdf",
    type: "Manual",
    documentType: "Director",
    company: "HR Dept",
    date: "2023-04-10",
    tags: ["hr", "policy"],
    size: "2.7 MB",
    directorName: "Emma Wilson",
    needsRenewal: true,
    renewalDate: "2024-04-10",
  },
  {
    id: 9,
    name: "Tax-Return-2023.pdf",
    type: "Tax",
    documentType: "Personal",
    company: "Personal",
    date: "2023-03-15",
    tags: ["tax", "finance", "personal"],
    size: "3.4 MB",
    personName: "David Brown",
    needsRenewal: true,
    renewalDate: "2024-03-15",
  },
  {
    id: 10,
    name: "Resume-2023.pdf",
    type: "Resume",
    documentType: "Personal",
    company: "Personal",
    date: "2023-02-10",
    tags: ["resume", "personal"],
    size: "0.8 MB",
    personName: "Lisa Garcia",
    needsRenewal: false,
  },
  {
    id: 11,
    name: "Board-Meeting-Minutes.docx",
    type: "Minutes",
    documentType: "Director",
    company: "Board",
    date: "2023-06-10",
    tags: ["board", "minutes", "meeting"],
    size: "1.1 MB",
    sharedWith: "board@example.com",
    sharedMethod: "email",
    directorName: "Robert Taylor",
    needsRenewal: false,
  },
  {
    id: 12,
    name: "Strategic-Plan-2023.pptx",
    type: "Plan",
    documentType: "Director",
    company: "Executive Team",
    date: "2023-05-28",
    tags: ["strategy", "plan", "executive"],
    size: "6.3 MB",
    directorName: "Jennifer Lee",
    needsRenewal: true,
    renewalDate: "2024-05-28",
  },
]

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([])

  useEffect(() => {
    // In a real app, you would fetch documents from an API
    // For now, we'll use the sample data
    setDocuments(initialDocuments)
  }, [])

  const addDocument = (document: Omit<Document, "id" | "date">) => {
    const newDocument: Document = {
      ...document,
      id: documents.length + 1,
      date: new Date().toISOString().split("T")[0],
    }
    setDocuments([...documents, newDocument])
  }

  const getDocumentsByType = (type: DocumentType) => {
    return documents.filter((doc) => doc.documentType === type)
  }

  const getDocumentStats = () => {
    return {
      total: documents.length,
      personal: getDocumentsByType("Personal").length,
      company: getDocumentsByType("Company").length,
      director: getDocumentsByType("Director").length,
      recent: documents.filter((doc) => {
        const docDate = new Date(doc.date)
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        return docDate >= oneWeekAgo
      }).length,
      shared: documents.filter((doc) => doc.sharedWith).length,
      needsRenewal: documents.filter((doc) => doc.needsRenewal).length,
    }
  }

  const getRecentDocuments = (limit = 5) => {
    return [...documents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
  }

  const getSharedDocuments = () => {
    return documents.filter((doc) => doc.sharedWith)
  }

  const getDocumentsNeedingRenewal = () => {
    return documents.filter((doc) => doc.needsRenewal)
  }

  return (
    <DocumentContext.Provider
      value={{
        documents,
        addDocument,
        getDocumentsByType,
        getDocumentStats,
        getRecentDocuments,
        getSharedDocuments,
        getDocumentsNeedingRenewal,
      }}
    >
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocuments() {
  const context = useContext(DocumentContext)
  if (context === undefined) {
    throw new Error("useDocuments must be used within a DocumentProvider")
  }
  return context
}
