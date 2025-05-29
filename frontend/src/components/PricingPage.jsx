import React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, UserGroupIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

const PricingPage = () => {
  const plans = [
    {
      name: 'Free Plan',
      price: '₹0',
      period: '/month',
      features: [
        '1 Organization',
        '1 Admin',
        'Up to 25 employees',
        'Up to 250 posts & 500 comments per month',
        'Media upload limit: 10 MB per file',
        'Up to 125 posts & 250 comments deletion limit for admin per month',
        'Up to 10 posts and 20 comments deletion limit per employee per month',
        '30 AI summaries run per month',
      ],
      buttonText: 'Get Started',
      popular: false,
      highlight: '',
    },
    {
      name: 'Pro Plan',
      price: '₹599',
      period: '/month',
      features: [
        'Up to 2 organizations',
        'Up to 5 admins per organization',
        'Up to 600 posts & 1200 comments per organization per month',
        'Up to 100 employees per organization',
        'Media upload limit: 20MB per file',
        'Up to 80 posts & 160 comments deletion limit per admin per organization per month',
        'Up to 25 posts and 50 comments deletion limit per employee per organization per month',
        'Up to 100 AI summaries run per month per organization',
      ],
      buttonText: 'Start Free Trial',
      popular: true,
      highlight: 'Most Popular',
    },
    {
      name: 'Enterprise Plan',
      price: '₹2,499',
      period: '/month',
      features: [
        'Up to 5 organizations',
        'Up to 10 admins per organization',
        'Unlimited posts and comments',
        'Up to 500 employees per organization',
        'Media upload limit: 50 MB per file',
        'Up to 500 posts & 1000 comments deletion limit per admin per organization per month',
        'Up to 50 posts and 100 comments deletion limit per employee per organization per month',
        'Priority support by email',
      ],
      buttonText: 'Contact Sales',
      popular: false,
      highlight: 'Best for Teams',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-100 p-3 rounded-full">
            <RocketLaunchIcon className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl mb-6">
          Flexible Plans for Every Organization
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-5">
          Choose the perfect plan that fits your organization's needs. Scale up as your team grows.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-5xl lg:mx-auto xl:max-w-none xl:mx-0">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 transition-all duration-300 hover:shadow-lg ${
                plan.popular ? 'border-indigo-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute inset-x-0 top-0 transform -translate-y-1/2 flex justify-center">
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    {plan.highlight}
                  </span>
                </div>
              )}
              {!plan.popular && plan.highlight && (
                <div className="absolute inset-x-0 top-0 transform -translate-y-1/2 flex justify-center">
                  <span className="bg-purple-600 text-white text-xs font-semibold px-4 py-1 rounded-full flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-1" /> {plan.highlight}
                  </span>
                </div>
              )}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-base font-medium text-gray-500">{plan.period}</span>
                </p>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-6 pt-6 pb-8">
                {plan.buttonText === 'Contact Sales' ? (
                  <Link
                    to="/?showContact=true"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105"
                  >
                    {plan.buttonText}
                  </Link>
                ) : (
                  <Link
                    to="/signup"
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105 ${
                      plan.popular ? 'bg-indigo-700 hover:bg-indigo-800' : ''
                    }`}
                  >
                    {plan.buttonText}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Voicebox Anonymous. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                Privacy Policy
              </a>
            </div>
            <p className="mt-4 md:mt-0 text-sm text-gray-500 flex items-center">
              <span>Powered by</span>
              <span className="ml-1 font-medium text-indigo-600">Nexlify Studios</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;