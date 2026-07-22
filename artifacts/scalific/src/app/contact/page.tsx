"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ContactFormField } from "@/lib/types";

export default function ContactPage() {
  const [fields, setFields] = useState<ContactFormField[]>([]);
  const [contentBlocks, setContentBlocks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [fieldsRes, blocksRes] = await Promise.all([
          supabase.from("contact_form_fields").select("*").order("display_order"),
          supabase.from("content_blocks").select("section_key, content")
        ]);
        
        let finalFields: ContactFormField[] = [];
        if (fieldsRes.data && fieldsRes.data.length > 0) {
          finalFields = fieldsRes.data.filter((f) => f.field_name !== "message" && f.field_label.toLowerCase() !== "message");
        }
        
        if (finalFields.length === 0) {
           finalFields = [
             { id: "default-name", field_label: "Name", field_name: "name", field_type: "text", is_required: true, display_order: 1, options: null },
             { id: "default-email", field_label: "Email", field_name: "email", field_type: "email", is_required: true, display_order: 2, options: null },
           ];
        }

        const hasReq = finalFields.some(
          (f) => f.field_name === "requirements" || f.field_label.toLowerCase() === "requirements"
        );
        if (!hasReq) {
          finalFields.push({
            id: "default-req",
            field_label: "Requirements",
            field_name: "requirements",
            field_type: "textarea",
            is_required: true,
            options: null,
            display_order: 3
          });
        }
        setFields(finalFields);

        if (blocksRes.data) {
          const blocksMap: Record<string, string> = {};
          blocksRes.data.forEach(block => {
            if (block.section_key && block.content) {
              blocksMap[block.section_key] = block.content;
            }
          });
          setContentBlocks(blocksMap);
        }
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const schemaObj: Record<string, z.ZodTypeAny> = {};
  fields.forEach(field => {
    let validator;
    if (field.field_type === "email") {
      validator = z.string().email("Invalid email address");
    } else {
      validator = z.string();
    }
    if (field.is_required) {
      validator = validator.min(1, "This field is required");
    } else {
      validator = validator.optional().or(z.literal(""));
    }
    schemaObj[field.field_name] = validator;
  });

  const formSchema = z.object(schemaObj);
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('contact_submissions').insert({ data: values });
      if (error) throw error;
      setIsSuccess(true);
      form.reset();
      toast.success("Inquiry received. We'll be in touch shortly.");
    } catch (error) {
      console.error("Submission error", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const heading = contentBlocks.contact_heading || "Ready to scale?";
  const subtext = contentBlocks.contact_subtext || "Let's discuss how we can engineer your next phase of growth. Fill out the form, and a partner will be in touch within 24 hours.";
  const email = contentBlocks.contact_email || "hello@scalific.in";
  const location = contentBlocks.contact_location || "Remote-first, serving clients worldwide.";
  const successTitle = contentBlocks.contact_form_success_title || "Message Received";
  const successMessage = contentBlocks.contact_form_success_message || "Our team will review your inquiry and reach out within 24 hours.";
  const successButton = contentBlocks.contact_form_success_button || "Send Another Message";
  const submitLabel = contentBlocks.contact_form_submit_label || "Submit Inquiry";
  const sendingLabel = contentBlocks.contact_form_sending_label || "Sending...";

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-12">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">{heading}</h1>
            <p className="text-xl text-muted-foreground mb-12">
              {subtext}
            </p>
 
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-foreground">{email}</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-foreground">{location}</span>
              </div>
            </div>
          </div>
 
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-md relative overflow-hidden">
            {isSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{successTitle}</h3>
                  <p className="text-muted-foreground">{successMessage}</p>
                </div>
                <Button variant="outline" onClick={() => setIsSuccess(false)}>{successButton}</Button>
              </div>
            ) : loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading form...</div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                  {fields.map(field => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={field.field_name}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">
                            {field.field_label} {field.is_required && <span className="text-primary">*</span>}
                          </FormLabel>
                          <FormControl>
                            {field.field_type === "textarea" ? (
                              <Textarea 
                                placeholder={`Enter your ${field.field_label.toLowerCase()}`} 
                                className="bg-gray-50 border-gray-200 focus-visible:ring-primary min-h-[120px] resize-none"
                                {...formField} 
                              />
                            ) : (
                              <Input 
                                type={field.field_type === "email" ? "email" : "text"}
                                placeholder={`Enter your ${field.field_label.toLowerCase()}`} 
                                className="bg-gray-50 border-gray-200 focus-visible:ring-primary h-12"
                                {...formField} 
                              />
                            )}
                          </FormControl>
                          <FormMessage className="text-destructive/80" />
                        </FormItem>
                      )}
                    />
                  ))}
                  <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-lg font-semibold tracking-wide">
                    {isSubmitting ? sendingLabel : submitLabel}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
