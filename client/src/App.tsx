import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import ApplicationForm from "@/pages/application-form";
import Candidates from "@/pages/candidates";
import Interviews from "@/pages/interviews";
import Emails from "@/pages/emails";
import Assessments from "@/pages/assessments";
import JobDescriptions from "@/pages/job-descriptions";
import Users from "@/pages/users";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes - always available */}
      <Route path="/apply" component={ApplicationForm} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Conditional routes based on authentication */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/candidates" component={Candidates} />
          <Route path="/interviews" component={Interviews} />
          <Route path="/emails" component={Emails} />
          <Route path="/assessments" component={Assessments} />
          <Route path="/job-descriptions" component={JobDescriptions} />
          <Route path="/users" component={Users} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
