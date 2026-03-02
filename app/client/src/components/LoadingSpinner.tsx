export default function LoadingSpinner() {
  return (
    <div className="flex min-h-36 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
    </div>
  )
}
