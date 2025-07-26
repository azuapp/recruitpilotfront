import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import ApplicationForm from "@/pages/application-form";
import Candidates from "@/pages/candidates";
import Interviews from "@/pages/interviews";
import Emails from "@/pages/emails";
import Assessments from "@/pages/assessments";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/apply" component={ApplicationForm} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/candidates" component={Candidates} />
          <Route path="/apply" component={ApplicationForm} />
          <Route path="/interviews" component={Interviews} />
          <Route path="/emails" component={Emails} />
          <Route path="/assessments" component={Assessments} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
