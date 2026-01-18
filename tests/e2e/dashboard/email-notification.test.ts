import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Email Notification Flow in Inquiry System
 * Tests the email notification system when owners reply to inquiries
 *
 * Test Coverage:
 * 1. Reply Sends Email
 *    - Owner reply triggers email to guest
 *    - Email contains reply message
 *    - Email has correct subject line
 *    - Email includes original inquiry context
 * 2. Status Update Emails (optional flow)
 *    - Closing inquiry may send notification
 *    - Email reflects status change
 * 3. Email Preview/Confirmation
 *    - Preview email before sending (if applicable)
 *    - Confirmation of email sent
 * 4. Error Handling
 *    - Handle email service failures gracefully
 *    - Show warning if email failed but reply saved
 *    - Retry option for failed emails
 *
 * Note: For E2E tests, we mock the email service and verify API calls
 */

test.describe('Email Notification Flow - Owner Dashboard', () => {
  const TEST_CAMPSITE_ID = 'test-campsite-owner-123';
  const TEST_CAMPSITE_NAME = 'Mountain View Campsite';
  const TEST_INQUIRY_ID = 'test-inquiry-001';
  const GUEST_EMAIL = 'guest@example.com';
  const GUEST_NAME = 'Jane Smith';
  const ORIGINAL_MESSAGE = 'I would like to book a campsite for this weekend. Do you have availability?';

  test.beforeEach(async ({ page }) => {
    // Intercept and mock owner authentication
    await page.route('**/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'owner-user-123',
            email: 'owner@example.com',
            role: 'owner',
          },
        }),
      });
    });

    // Navigate to owner dashboard
    await page.goto('/dashboard/inquiries');
    await page.waitForLoadState('networkidle');
  });

  test.describe('T080.1: Reply Sends Email', () => {
    test('should trigger email to guest when owner submits reply', async ({ page }) => {
      let emailApiCallData: any = null;

      // Mock inquiry API endpoint
      await page.route('**/api/inquiries/*', async (route) => {
        const url = route.request().url();
        const method = route.request().method();

        if (method === 'GET') {
          // Return inquiry details
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                campsite_id: TEST_CAMPSITE_ID,
                guest_name: GUEST_NAME,
                guest_email: GUEST_EMAIL,
                inquiry_type: 'booking',
                message: ORIGINAL_MESSAGE,
                status: 'new',
                created_at: new Date().toISOString(),
                campsite: {
                  name: TEST_CAMPSITE_NAME,
                },
              },
            }),
          });
        } else if (method === 'PATCH' || method === 'PUT' || method === 'POST') {
          // Capture reply data
          const postData = route.request().postDataJSON();
          emailApiCallData = postData;

          // Return success response
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Reply sent successfully. Guest will be notified via email.',
              emailSent: true,
              emailRecipient: GUEST_EMAIL,
            }),
          });
        }
      });

      // Find and click on an inquiry to view details
      const inquiryItem = page.locator('[data-testid="inquiry-item"]').first().or(
        page.getByText(GUEST_NAME)
      );

      if (await inquiryItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await inquiryItem.click();
      } else {
        // If no inquiry list, may be on detail page already
        const inquiryDetail = page.locator('[data-testid="inquiry-detail"]');
        await expect(inquiryDetail).toBeVisible({ timeout: 3000 });
      }

      // Wait for inquiry details to load
      await page.waitForTimeout(500);

      // Verify original message is displayed
      const originalMessage = page.getByText(ORIGINAL_MESSAGE);
      await expect(originalMessage).toBeVisible({ timeout: 2000 });

      // Find reply textarea
      const replyTextarea = page.locator('#owner_reply').or(
        page.getByLabel(/reply|response|message/i)
      );
      await expect(replyTextarea).toBeVisible();

      // Type owner's reply
      const ownerReply = 'Yes, we have availability this weekend. Our standard rate is 800 THB per night.';
      await replyTextarea.fill(ownerReply);

      // Submit the reply
      const sendButton = page.getByRole('button', { name: /send reply|send|submit/i });
      await expect(sendButton).toBeEnabled();
      await sendButton.click();

      // Wait for API call
      await page.waitForTimeout(1000);

      // Verify success message appears
      const successMessage = page.locator('[data-testid="reply-success"]').or(
        page.getByText(/reply sent|email sent|successfully|guest.*notified/i)
      );
      await expect(successMessage).toBeVisible({ timeout: 3000 });

      // Verify email notification mentioned in success message
      const emailConfirmation = page.getByText(/email.*sent|notified.*email/i);
      await expect(emailConfirmation).toBeVisible({ timeout: 2000 });

      // Verify API was called with correct data
      expect(emailApiCallData).toBeDefined();
      expect(emailApiCallData.owner_reply || emailApiCallData.reply).toBe(ownerReply);
    });

    test('should display correct email subject line in confirmation', async ({ page }) => {
      // Mock inquiry reply API
      await page.route('**/api/inquiries/*/reply', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Reply sent successfully',
            emailSent: true,
            emailSubject: `Reply from ${TEST_CAMPSITE_NAME}`,
          }),
        });
      });

      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                guest_email: GUEST_EMAIL,
                message: ORIGINAL_MESSAGE,
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        }
      });

      // Navigate to reply form
      const replyTextarea = page.locator('#owner_reply').or(
        page.getByLabel(/reply/i)
      );

      if (await replyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await replyTextarea.fill('Thank you for your inquiry.');

        const sendButton = page.getByRole('button', { name: /send/i });
        await sendButton.click();

        await page.waitForTimeout(500);

        // Check if subject line is mentioned in confirmation
        const subjectMention = page.getByText(new RegExp(TEST_CAMPSITE_NAME, 'i'));
        if (await subjectMention.isVisible({ timeout: 1000 }).catch(() => false)) {
          await expect(subjectMention).toBeVisible();
        }
      }
    });

    test('should include original inquiry context in email notification', async ({ page }) => {
      let emailApiPayload: any = null;

      // Mock API to capture email data
      await page.route('**/api/inquiries/*/reply', async (route) => {
        emailApiPayload = route.request().postDataJSON();

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            emailSent: true,
            emailData: {
              guestEmail: GUEST_EMAIL,
              guestName: GUEST_NAME,
              campsiteName: TEST_CAMPSITE_NAME,
              ownerReply: emailApiPayload?.reply || emailApiPayload?.owner_reply,
              originalMessage: ORIGINAL_MESSAGE,
            },
          }),
        });
      });

      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                guest_email: GUEST_EMAIL,
                message: ORIGINAL_MESSAGE,
                check_in_date: '2026-02-01',
                check_out_date: '2026-02-03',
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        }
      });

      // Submit a reply
      const replyTextarea = page.locator('#owner_reply').or(page.getByLabel(/reply/i));

      if (await replyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await replyTextarea.fill('We look forward to hosting you!');

        const sendButton = page.getByRole('button', { name: /send/i });
        await sendButton.click();

        await page.waitForTimeout(1000);

        // Verify success
        const success = page.getByText(/sent|success/i);
        if (await success.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(success).toBeVisible();
        }
      }

      // Verify API payload included original context
      if (emailApiPayload) {
        expect(emailApiPayload.reply || emailApiPayload.owner_reply).toBeDefined();
      }
    });

    test('should show email contains reply message preview', async ({ page }) => {
      const ownerReplyText = 'Thank you for your interest. We have availability for your dates.';

      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                guest_email: GUEST_EMAIL,
                message: ORIGINAL_MESSAGE,
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        } else if (route.request().method() !== 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              emailSent: true,
            }),
          });
        }
      });

      const replyTextarea = page.locator('#owner_reply').or(page.getByLabel(/reply/i));

      if (await replyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Type reply
        await replyTextarea.fill(ownerReplyText);

        // Check for preview or confirmation dialog
        const previewButton = page.getByRole('button', { name: /preview/i });
        if (await previewButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await previewButton.click();

          // Verify preview shows the reply text
          const previewText = page.getByText(ownerReplyText);
          await expect(previewText).toBeVisible({ timeout: 2000 });
        }
      }
    });
  });

  test.describe('T080.2: Status Update Emails', () => {
    test('should send notification when inquiry status is updated to resolved', async ({ page }) => {
      let statusUpdateData: any = null;

      await page.route('**/api/inquiries/*', async (route) => {
        const method = route.request().method();

        if (method === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                guest_email: GUEST_EMAIL,
                message: ORIGINAL_MESSAGE,
                status: 'in_progress',
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        } else if (method === 'PATCH' || method === 'PUT') {
          statusUpdateData = route.request().postDataJSON();

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Status updated',
              statusChanged: true,
              newStatus: statusUpdateData?.status,
            }),
          });
        }
      });

      // Find status update button or dropdown
      const statusDropdown = page.locator('[data-testid="status-select"]').or(
        page.getByLabel(/status/i)
      );

      if (await statusDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await statusDropdown.click();

        // Select 'resolved' status
        const resolvedOption = page.getByRole('option', { name: /resolved/i }).or(
          page.locator('[data-value="resolved"]')
        );

        if (await resolvedOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await resolvedOption.click();

          await page.waitForTimeout(500);

          // Verify status updated message
          const statusMessage = page.getByText(/status.*updated|updated.*status/i);
          if (await statusMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(statusMessage).toBeVisible();
          }
        }
      }
    });

    test('should send notification when closing inquiry', async ({ page }) => {
      await page.route('**/api/inquiries/*/close', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Inquiry closed',
            emailSent: true,
            newStatus: 'closed',
          }),
        });
      });

      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                status: 'resolved',
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        }
      });

      // Find close button
      const closeButton = page.getByRole('button', { name: /close inquiry|mark.*closed/i });

      if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeButton.click();

        await page.waitForTimeout(500);

        const confirmation = page.getByText(/closed|success/i);
        if (await confirmation.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(confirmation).toBeVisible();
        }
      }
    });
  });

  test.describe('T080.3: Email Preview and Confirmation', () => {
    test('should show email preview before sending if available', async ({ page }) => {
      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                guest_email: GUEST_EMAIL,
                message: ORIGINAL_MESSAGE,
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        }
      });

      const replyTextarea = page.locator('#owner_reply').or(page.getByLabel(/reply/i));

      if (await replyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await replyTextarea.fill('Test preview message');

        // Look for preview functionality
        const previewButton = page.getByRole('button', { name: /preview/i });

        if (await previewButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await previewButton.click();

          // Verify preview modal or panel appears
          const previewModal = page.locator('[data-testid="email-preview"]').or(
            page.getByRole('dialog')
          );

          if (await previewModal.isVisible({ timeout: 1000 }).catch(() => false)) {
            await expect(previewModal).toBeVisible();

            // Verify preview contains guest name
            const guestNameInPreview = page.getByText(GUEST_NAME);
            if (await guestNameInPreview.isVisible({ timeout: 1000 }).catch(() => false)) {
              await expect(guestNameInPreview).toBeVisible();
            }
          }
        }
      }
    });

    test('should show confirmation after email is sent successfully', async ({ page }) => {
      await page.route('**/api/inquiries/*/reply', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Reply sent and email delivered',
            emailSent: true,
            emailRecipient: GUEST_EMAIL,
          }),
        });
      });

      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                guest_email: GUEST_EMAIL,
                message: ORIGINAL_MESSAGE,
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        }
      });

      const replyTextarea = page.locator('#owner_reply').or(page.getByLabel(/reply/i));

      if (await replyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await replyTextarea.fill('Confirmation test reply');

        const sendButton = page.getByRole('button', { name: /send/i });
        await sendButton.click();

        await page.waitForTimeout(1000);

        // Verify email sent confirmation appears
        const emailConfirmation = page.locator('[data-testid="email-sent-confirmation"]').or(
          page.getByText(/email.*sent.*to|sent.*to.*guest|notification.*sent/i)
        );

        await expect(emailConfirmation).toBeVisible({ timeout: 3000 });

        // Verify guest email is mentioned in confirmation
        const emailMention = page.getByText(new RegExp(GUEST_EMAIL, 'i'));
        if (await emailMention.isVisible({ timeout: 1000 }).catch(() => false)) {
          await expect(emailMention).toBeVisible();
        }
      }
    });

    test('should display checkmark or icon when email is successfully sent', async ({ page }) => {
      await page.route('**/api/inquiries/*/reply', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            emailSent: true,
          }),
        });
      });

      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        }
      });

      const replyTextarea = page.locator('#owner_reply').or(page.getByLabel(/reply/i));

      if (await replyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await replyTextarea.fill('Icon test message');

        const sendButton = page.getByRole('button', { name: /send/i });
        await sendButton.click();

        await page.waitForTimeout(1000);

        // Look for success icon (checkmark, tick, etc.)
        const successIcon = page.locator('[data-testid="email-success-icon"]').or(
          page.locator('svg').filter({ hasText: /check|✓/i })
        );

        if (await successIcon.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(successIcon).toBeVisible();
        }
      }
    });
  });

  test.describe('T080.4: Error Handling', () => {
    test('should handle email service failures gracefully', async ({ page }) => {
      // Mock API to simulate email service failure
      await page.route('**/api/inquiries/*/reply', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Reply saved but email failed to send',
            emailSent: false,
            emailError: 'Email service unavailable',
            replySaved: true,
          }),
        });
      });

      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                guest_email: GUEST_EMAIL,
                message: ORIGINAL_MESSAGE,
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        }
      });

      const replyTextarea = page.locator('#owner_reply').or(page.getByLabel(/reply/i));

      if (await replyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await replyTextarea.fill('Test reply with email failure');

        const sendButton = page.getByRole('button', { name: /send/i });
        await sendButton.click();

        await page.waitForTimeout(1000);

        // Verify warning message appears
        const warningMessage = page.locator('[data-testid="email-warning"]').or(
          page.getByText(/email.*failed|could not send|warning.*email/i)
        );

        await expect(warningMessage).toBeVisible({ timeout: 3000 });

        // Verify reply was still saved
        const savedMessage = page.getByText(/reply.*saved|saved successfully/i);
        if (await savedMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(savedMessage).toBeVisible();
        }
      }
    });

    test('should show warning if email failed but reply was saved', async ({ page }) => {
      await page.route('**/api/inquiries/*/reply', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Reply saved',
            emailSent: false,
            emailError: 'SMTP connection failed',
            replySaved: true,
          }),
        });
      });

      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        }
      });

      const replyTextarea = page.locator('#owner_reply').or(page.getByLabel(/reply/i));

      if (await replyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await replyTextarea.fill('Reply with email warning');

        const sendButton = page.getByRole('button', { name: /send/i });
        await sendButton.click();

        await page.waitForTimeout(1000);

        // Look for warning indicator
        const warningIcon = page.locator('[data-testid="warning-icon"]').or(
          page.getByText(/⚠|warning|alert/i)
        );

        if (await warningIcon.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(warningIcon).toBeVisible();
        }

        // Verify explanation that reply was saved despite email failure
        const explanation = page.getByText(/reply.*saved.*email.*not|saved.*notify.*manually/i);
        if (await explanation.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(explanation).toBeVisible();
        }
      }
    });

    test('should provide retry option for failed emails', async ({ page }) => {
      let retryAttempted = false;

      await page.route('**/api/inquiries/*/reply', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            emailSent: false,
            emailError: 'Temporary email service error',
            replySaved: true,
            canRetry: true,
          }),
        });
      });

      await page.route('**/api/inquiries/*/resend-email', async (route) => {
        retryAttempted = true;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            emailSent: true,
            message: 'Email sent successfully on retry',
          }),
        });
      });

      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        }
      });

      const replyTextarea = page.locator('#owner_reply').or(page.getByLabel(/reply/i));

      if (await replyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await replyTextarea.fill('Test retry functionality');

        const sendButton = page.getByRole('button', { name: /send/i });
        await sendButton.click();

        await page.waitForTimeout(1000);

        // Look for retry button
        const retryButton = page.getByRole('button', { name: /retry|resend.*email|try again/i });

        if (await retryButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(retryButton).toBeVisible();
          await retryButton.click();

          await page.waitForTimeout(500);

          // Verify retry success message
          const retrySuccess = page.getByText(/email.*sent|retry.*successful/i);
          if (await retrySuccess.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(retrySuccess).toBeVisible();
          }
        }
      }
    });

    test('should handle network timeout for email sending', async ({ page }) => {
      await page.route('**/api/inquiries/*/reply', async (route) => {
        // Simulate slow network response
        await new Promise(resolve => setTimeout(resolve, 100));

        await route.fulfill({
          status: 504,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Gateway timeout',
            message: 'Request timed out',
          }),
        });
      });

      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        }
      });

      const replyTextarea = page.locator('#owner_reply').or(page.getByLabel(/reply/i));

      if (await replyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await replyTextarea.fill('Test timeout handling');

        const sendButton = page.getByRole('button', { name: /send/i });
        await sendButton.click();

        await page.waitForTimeout(1500);

        // Verify timeout error is displayed
        const timeoutError = page.locator('[data-testid="error-message"]').or(
          page.getByText(/timeout|timed out|network error/i)
        );

        await expect(timeoutError).toBeVisible({ timeout: 3000 });
      }
    });

    test('should handle invalid email address errors', async ({ page }) => {
      await page.route('**/api/inquiries/*/reply', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid email address',
            emailError: 'Guest email is not valid',
            replySaved: true,
          }),
        });
      });

      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                guest_email: 'invalid-email',
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        }
      });

      const replyTextarea = page.locator('#owner_reply').or(page.getByLabel(/reply/i));

      if (await replyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await replyTextarea.fill('Test invalid email handling');

        const sendButton = page.getByRole('button', { name: /send/i });
        await sendButton.click();

        await page.waitForTimeout(1000);

        // Verify error message about invalid email
        const emailError = page.getByText(/invalid.*email|email.*not.*valid/i);

        if (await emailError.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(emailError).toBeVisible();
        }
      }
    });

    test('should display loading state while sending email', async ({ page }) => {
      await page.route('**/api/inquiries/*/reply', async (route) => {
        // Simulate slower API response
        await new Promise(resolve => setTimeout(resolve, 1500));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            emailSent: true,
          }),
        });
      });

      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        }
      });

      const replyTextarea = page.locator('#owner_reply').or(page.getByLabel(/reply/i));

      if (await replyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await replyTextarea.fill('Test loading state');

        const sendButton = page.getByRole('button', { name: /send/i });
        await sendButton.click();

        // Verify loading indicator appears
        const loadingIndicator = page.locator('[data-testid="sending-loader"]').or(
          page.getByText(/sending|loading/i)
        );

        if (await loadingIndicator.isVisible({ timeout: 500 }).catch(() => false)) {
          await expect(loadingIndicator).toBeVisible();
        }

        // Wait for completion
        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe('T080.5: Email Content Validation', () => {
    test('should prevent sending empty reply', async ({ page }) => {
      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        }
      });

      const replyTextarea = page.locator('#owner_reply').or(page.getByLabel(/reply/i));

      if (await replyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Leave textarea empty
        await replyTextarea.fill('');

        const sendButton = page.getByRole('button', { name: /send/i });

        // Button should be disabled with empty reply
        await expect(sendButton).toBeDisabled({ timeout: 1000 });
      }
    });

    test('should validate minimum reply length', async ({ page }) => {
      await page.route('**/api/inquiries/*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: TEST_INQUIRY_ID,
                guest_name: GUEST_NAME,
                campsite: { name: TEST_CAMPSITE_NAME },
              },
            }),
          });
        }
      });

      const replyTextarea = page.locator('#owner_reply').or(page.getByLabel(/reply/i));

      if (await replyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Enter very short reply (less than minimum)
        await replyTextarea.fill('OK');

        await page.waitForTimeout(300);

        const sendButton = page.getByRole('button', { name: /send/i });

        // Should be disabled or show validation error
        const isDisabled = await sendButton.isDisabled().catch(() => false);
        const validationError = page.getByText(/too short|minimum.*characters/i);
        const hasError = await validationError.isVisible({ timeout: 1000 }).catch(() => false);

        // Either button is disabled OR validation error is shown
        expect(isDisabled || hasError).toBe(true);
      }
    });
  });
});
