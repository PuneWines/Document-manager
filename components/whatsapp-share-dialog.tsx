"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText } from "lucide-react"

interface WhatsAppShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  whatsappNumber: string
  setWhatsappNumber: React.Dispatch<React.SetStateAction<string>>
  selectedDocuments: Array<{
    id: number
    name: string
  }>
  onShare: () => void
}

export function WhatsAppShareDialog({
  open,
  onOpenChange,
  whatsappNumber,
  setWhatsappNumber,
  selectedDocuments,
  onShare,
}: WhatsAppShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#7569F6]">Share Documents via WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input
              id="whatsappNumber"
              placeholder="Enter recipient's phone number (e.g., 1234567890)"
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="border-gray-300 focus:border-[#7569F6] focus:ring-[#7569F6]"
            />
            <p className="text-xs text-gray-500">Enter the number without any special characters or spaces</p>
          </div>

          <div>
            <p className="text-sm font-medium text-[#7569F6]">Selected Documents:</p>
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
            disabled={!whatsappNumber}
            className="bg-gradient-to-r from-[#407FF6] via-[#5477F6] to-[#7569F6] hover:from-[#5477F6] hover:via-[#7569F6] hover:to-[#935DF6] text-white w-full sm:w-auto"
          >
            Share via WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}