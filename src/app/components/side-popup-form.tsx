"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Check } from "lucide-react"

interface SelectOption {
  value: string
  label: string
}

type FormField =
  | { key: string; label: string; type: "text"; placeholder?: string; required?: boolean }
  | { key: string; label: string; type: "textarea"; placeholder?: string; required?: boolean }
  | { key: string; label: string; type: "toggle"; placeholder?: string; required?: boolean }
  | { key: string; label: string; type: "select"; placeholder?: string; required?: boolean; options?: SelectOption[] }
  | { key: string; label: string; type: "multivalue"; placeholder?: string; required?: boolean }

interface SidePopupFormProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  fields: FormField[]
  onSubmit?: (data: Record<string, any>) => void
}

export function SidePopupForm({ isOpen, onClose, title = "Add New Entry", fields, onSubmit }: SidePopupFormProps) {
  const [formData, setFormData] = useState(() => {
    const initialData: Record<string, any> = {}
    fields.forEach((field) => {
      if (field.type === "toggle") initialData[field.key] = "active"
      else if (field.type === "multivalue") initialData[field.key] = []
      else initialData[field.key] = ""
    })
    return initialData
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    if (onSubmit) {
      onSubmit(formData)
    }
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddMultiValue = (field: string, value: string) => {
    if (!value.trim()) return
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }))
  }

  const handleRemoveMultiValue = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index),
    }))
  }

  const toggleField = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] === "active" ? "inactive" : "active",
    }))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Side Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-card border-l border-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col relative">
            {/* Circular icon buttons at top left */}
            <div className="absolute top-4 right-4 flex gap-2 z-10 mb-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full border-2 hover:bg-red-50 hover:border-red-300 bg-transparent"
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
              <Button type="submit" size="sm" className="h-8 w-8 p-0 rounded-full bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4 text-white" />
              </Button>
            </div>

            <div className="flex-1 p-6 space-y-6">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="text-sm font-medium text-card-foreground">
                    {field.label}
                  </Label>

                  {/* Select */}
                  {field.type === "select" && (
                    <select
                      id={field.key}
                      value={formData[field.key]}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className="w-full rounded-md border border-input bg-background p-2 text-sm"
                      required={field.required}
                    >
                      <option value="">{field.placeholder || `Select ${field.label}`}</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Multi-value field */}
                  {field.type === "multivalue" && (
                    <div>
                      <Input
                        id={field.key}
                        type="text"
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddMultiValue(field.key, (e.target as HTMLInputElement).value)
                            ;(e.target as HTMLInputElement).value = ""
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData[field.key].map((val: string, index: number) => (
                          <span
                            key={index}
                            className="flex items-center gap-1 bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {val}
                            <button
                              type="button"
                              onClick={() => handleRemoveMultiValue(field.key, index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text */}
                  {field.type === "text" && (
                    <Input
                      id={field.key}
                      type="text"
                      value={formData[field.key]}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      className="w-full"
                      required={field.required}
                    />
                  )}
                  {/* Textarea */}
                  {field.type === "textarea" && (
                    <Textarea
                      id={field.key}
                      value={formData[field.key]}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      className="w-full min-h-24 resize-none"
                      rows={4}
                    />
                  )}
                  {/* Toggle */}
                  {field.type === "toggle" && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleField(field.key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                          formData[field.key] === "active" ? "bg-green-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData[field.key] === "active" ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="text-sm text-card-foreground font-medium">
                        {formData[field.key] === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
