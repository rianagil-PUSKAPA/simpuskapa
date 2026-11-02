const Unauthorize = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="px-4 text-center">
        <h1 className="text-xl font-bold">Your AUTH_TOKEN & REFRESH_TOKEN is UNAUTHORIZED</h1>
        <p>This page shown for development purpose only. Please login instead 😊</p>
      </div>
    </div>
  )
}

export default Unauthorize
