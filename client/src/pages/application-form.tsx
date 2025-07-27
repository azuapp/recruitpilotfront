import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Upload, CheckCircle, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const applicationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  linkedinProfile: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  position: z.string().min(1, "Please select a position"),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

export default function ApplicationForm() {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      linkedinProfile: "",
      position: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ApplicationForm & { cv: File }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'cv') {
          formData.append(key, value);
        } else {
          formData.append(key, value as string);
        }
      });

      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Application submission failed');
      }

      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you soon.",
      });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ApplicationForm) => {
    if (!cvFile) {
      toast({
        title: "CV Required",
        description: "Please upload your CV in PDF format.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({ ...data, cv: cvFile });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF file only.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setCvFile(file);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="p-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted Successfully!</h2>
              <p className="text-gray-600">
                Thank you for your application. We'll review your submission and get back to you within 3-5 business days.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Users className="text-white text-xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">RecruitPro</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Join Our Team</h2>
          <p className="text-gray-600">Submit your application and let AI help us find the perfect match</p>
        </div>

        {/* Application Form */}
        <Card className="shadow-xl">
          <CardContent className="p-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    {...form.register("fullName")}
                    placeholder="Enter your full name"
                    className="mt-2"
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.fullName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="your.email@example.com"
                    className="mt-2"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...form.register("phone")}
                    placeholder="+1 (555) 123-4567"
                    className="mt-2"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
                  <Input
                    id="linkedinProfile"
                    type="url"
                    {...form.register("linkedinProfile")}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="mt-2"
                  />
                  {form.formState.errors.linkedinProfile && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.linkedinProfile.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Job Position */}
              <div>
                <Label htmlFor="position">Job Position *</Label>
                <Select onValueChange={(value) => form.setValue("position", value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontend-developer">Frontend Developer</SelectItem>
                    <SelectItem value="backend-developer">Backend Developer</SelectItem>
                    <SelectItem value="fullstack-developer">Full Stack Developer</SelectItem>
                    <SelectItem value="ui-ux-designer">UI/UX Designer</SelectItem>
                    <SelectItem value="data-scientist">Data Scientist</SelectItem>
                    <SelectItem value="product-manager">Product Manager</SelectItem>
                    <SelectItem value="devops-engineer">DevOps Engineer</SelectItem>
                    <SelectItem value="qa-engineer">QA Engineer</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.position && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.position.message}
                  </p>
                )}
              </div>

              {/* CV Upload */}
              <div>
                <Label htmlFor="cv">Upload CV (PDF only) *</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    id="cv"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => document.getElementById('cv')?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors ${
                      cvFile ? 'border-green-300 bg-green-50' : 'border-gray-300'
                    }`}
                  >
                    {cvFile ? (
                      <div>
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-medium text-green-700 mb-2">CV uploaded successfully!</p>
                        <p className="text-sm text-gray-600">{cvFile.name}</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-600 mb-2">Drop your CV here or click to browse</p>
                        <p className="text-sm text-gray-500">PDF files only, max 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full bg-primary text-white py-4 px-6 text-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitMutation.isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">© 2024 RecruitPro. Powered by AI for smarter hiring decisions.</p>
        </div>
      </div>
    </div>
  );
}
