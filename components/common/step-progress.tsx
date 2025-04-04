interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mt-4 relative">
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
        <div
          className="h-2 bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );
}
