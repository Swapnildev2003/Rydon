import React, { useState } from "react";
import Sidebar from "../components/SidebarData";
import BankDetailsForm from "../components/BankDetailsForm";
import GSTDetailsForm from "../components/GstDetailsForm";
import DocumentsUpload from "../components/DocumentsUpload";
import PersonalDetailsForm from "../components/PersonalDetailsForm";

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  const markStepCompleted = (stepIndex) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps((prev) => [...prev, stepIndex]);
    }
    setCurrentStep((prev) => prev + 1); // auto-next
  };

  const handleSidebarStepChange = (step) => {
    if (step <= currentStep && completedSteps.includes(step)) {
      setCurrentStep(step);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalDetailsForm onSuccess={() => markStepCompleted(0)} />;
      case 1:
        return <BankDetailsForm onSuccess={() => markStepCompleted(1)} />;
      case 2:
        return <GSTDetailsForm onSuccess={() => markStepCompleted(2)} />;
      case 3:
        return <DocumentsUpload onSuccess={() => markStepCompleted(3)} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        currentStep={currentStep}
        setCurrentStep={handleSidebarStepChange}
        completedSteps={completedSteps}
      />
      <main className="flex-1 bg-amber-600 flex items-center justify-center p-10">
        {renderStep()}
      </main>
    </div>
  );
}
