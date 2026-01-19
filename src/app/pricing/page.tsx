'use client';

import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: 0,
    interval: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Basic access to venue',
      'Community support',
      'Limited features',
      'Email notifications',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Basic',
    price: 9.99,
    interval: 'month',
    description: 'Best for individual members',
    features: [
      'Full venue access',
      'Priority support',
      'All basic features',
      'Email & SMS notifications',
      'Member directory',
      'Event booking',
    ],
    cta: 'Subscribe Now',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: 29.99,
    interval: 'month',
    description: 'For power users and teams',
    features: [
      'Everything in Basic',
      'Premium venue access',
      'VIP support 24/7',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Dedicated account manager',
    ],
    cta: 'Subscribe Now',
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Select the perfect membership tier for your needs
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-6xl lg:mx-auto lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg shadow-lg divide-y divide-gray-200 ${
                plan.highlighted
                  ? 'border-2 border-purple-500 transform scale-105'
                  : 'border border-gray-200'
              } bg-white`}
            >
              <div className="p-6">
                {plan.highlighted && (
                  <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-purple-100 text-purple-600">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-semibold text-gray-900 mt-4">
                  {plan.name}
                </h3>
                <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    /{plan.interval}
                  </span>
                </p>
                <Link
                  href={plan.price === 0 ? '/signup' : '/dashboard'}
                  className={`mt-8 block w-full rounded-md py-3 px-6 text-center font-medium ${
                    plan.highlighted
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-800 text-white hover:bg-gray-900'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h4 className="text-sm font-medium text-gray-900 tracking-wide uppercase">
                  What's included
                </h4>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex space-x-3">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-base text-gray-500">
            Need a custom plan?{' '}
            <a href="mailto:support@venue-mvp.com" className="font-medium text-purple-600 hover:text-purple-500">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
