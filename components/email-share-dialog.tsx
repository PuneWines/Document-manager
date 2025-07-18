"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"

interface EmailShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  emailData: {
    to: string
    name: string
    subject: string
    message: string
  }
  setEmailData: React.Dispatch<
    React.SetStateAction<{
      to: string
      name: string
      subject: string
      message: string
    }>
  >
  selectedDocuments: Array<{
    id: number
    name: string
  }>
  onShare: () => void
}

export function EmailShareDialog({
  open,
  onOpenChange,
  emailData,
  setEmailData,
  selectedDocuments,
  onShare,
}: EmailShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-emerald-800">Share Documents via Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Recipient Name</Label>
              <Input
                id="name"
                placeholder="Enter recipient's name"
                value={emailData.name}
                onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                placeholder="Enter recipient's email"
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter email subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message"
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                rows={4}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-emerald-700">Selected Documents:</p>
            <div className="mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
              <ul className="space-y-1">
                {selectedDocuments.map((doc) => (
                  <li key={doc.id} className="text-sm flex items-center">
                    <FileText className="h-3 w-3 mr-2 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{doc.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 w-full sm:w-auto">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={onShare}
            disabled={!emailData.to || !emailData.name}
            className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
          >
            Share Documents
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
