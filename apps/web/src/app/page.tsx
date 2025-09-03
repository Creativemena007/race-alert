import SignupForm from '@/components/SignupForm'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Never Miss Marathon Registration Again
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get instant notifications when registration opens for the world&apos;s most popular marathons
          </p>
        </div>

        {/* Email Signup Form */}
        <SignupForm />

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-2">Major Marathons</h3>
              <p className="text-gray-600">Boston, London, Berlin, Chicago, NYC and more</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-2">Instant Alerts</h3>
              <p className="text-gray-600">Email notifications the moment registration opens</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-2">Always Free</h3>
              <p className="text-gray-600">No subscription fees, just helpful race alerts</p>
            </div>
          </div>
        </div>

        {/* Popular Races */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Monitored Races</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              'Boston Marathon',
              'London Marathon', 
              'Berlin Marathon',
              'Chicago Marathon',
              'NYC Marathon',
              'Tokyo Marathon',
              'Paris Marathon',
              'Valencia Marathon',
              'Lagos Marathon',
              'Comrades Marathon'
            ].map((race) => (
              <div key={race} className="bg-white rounded-lg p-4 shadow-sm text-center">
                <p className="text-sm font-medium text-gray-900">{race}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}