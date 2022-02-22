# frozen_string_literal: true

require "test_helper"
require "utils/rails_generator_runtime"
require "generators/shopify_app/home_controller/home_controller_generator"
require "generators/shopify_app/authenticated_controller/authenticated_controller_generator"
require "dummy/app/controllers/application_controller"

class HomeControllerGeneratorWithExecutionTest < ActiveSupport::TestCase
  test "generates authenticated HomeController class if not embedded" do
    assert_home_controller_is_authenticated(authenticated: false, is_embedded: false)
  end

  test "generates valid embedded HomeController class" do
    with_home_controller(authenticated: false, is_embedded: true) do
      refute(defined?(AuthenticatedController))
      assert(HomeController < ApplicationController)
      assert(HomeController.include?(ShopifyApp::ShopAccessScopesVerification))
    end
  end

  test "generates valid HomeController class with authentication" do
    assert_home_controller_is_authenticated(authenticated: true, is_embedded: false)
  end

  test "generates valid embedded HomeController class with authentication" do
    assert_home_controller_is_authenticated(authenticated: true, is_embedded: true)
  end

  test "generates HomeController which fetches products and webhooks" do
    with_home_controller(authenticated: true, is_embedded: false) do |runtime|
      controller = runtime.controller(HomeController)

      stub_request(:get, "https://my-shop/admin/api/unstable/products.json?limit=10")
        .to_return(status: 200, body: "{\"products\":[]}", headers: {})

      stub_request(:get, "https://my-shop/admin/api/unstable/webhooks.json")
        .to_return(status: 200, body: "{}", headers: {})

      controller.index
    end
  end

  private

  def assert_home_controller_is_authenticated(authenticated:, is_embedded:)
    with_home_controller(authenticated: authenticated, is_embedded: is_embedded) do
      assert(HomeController < AuthenticatedController)
      assert(HomeController.include?(ShopifyApp::ShopAccessScopesVerification))
    end
  end

  def with_home_controller(authenticated:, is_embedded:, &block)
    Utils::RailsGeneratorRuntime.with_session(self, is_embedded: is_embedded) do |runtime|

      home_controller_generator_options = []
      home_controller_generator_options << "--with_cookie_authentication" if authenticated
      home_controller_generator_options += %w(--embedded false) unless is_embedded

      generates_authenticated_controller = authenticated || !is_embedded

      refute(defined?(HomeController))

      if generates_authenticated_controller
        runtime.run_generator(ShopifyApp::Generators::AuthenticatedControllerGenerator)
      end

      runtime.run_generator(ShopifyApp::Generators::HomeControllerGenerator, home_controller_generator_options)

      assert(defined?(HomeController))

      block.call(runtime)
    end
  end
end
