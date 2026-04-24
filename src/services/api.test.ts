import { afterEach, describe, expect, test, vi } from 'vitest'
import { generateImage } from './api'

function createJsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('generateImage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  test('submits a job and polls until success', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        createJsonResponse({ ok: true, jobId: 'job-1', status: 'queued', createdAt: 1 }, 202)
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          jobId: 'job-1',
          status: 'running',
          prompt: '一只红苹果',
          createdAt: 1,
          updatedAt: 2,
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          jobId: 'job-1',
          status: 'succeeded',
          prompt: '一只红苹果',
          createdAt: 1,
          updatedAt: 3,
          imageUrl: 'data:image/png;base64,abc',
          providerName: '1024token',
        })
      )

    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()

    const promise = generateImage({
      prompt: '一只红苹果',
      preferredProviders: ['1024token', 'custom'],
    })

    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(1500)

    await expect(promise).resolves.toEqual({
      imageUrl: 'data:image/png;base64,abc',
      prompt: '一只红苹果',
      providerName: '1024token',
    })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/generate/jobs')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
    })
    expect(fetchMock.mock.calls[1][0]).toBe('/api/generate/jobs/job-1')
    expect(fetchMock.mock.calls[2][0]).toBe('/api/generate/jobs/job-1')
  })

  test('cancels the job when aborted', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        createJsonResponse({ ok: true, jobId: 'job-2', status: 'queued', createdAt: 1 }, 202)
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          jobId: 'job-2',
          status: 'running',
          prompt: '一只红苹果',
          createdAt: 1,
          updatedAt: 2,
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          jobId: 'job-2',
          status: 'canceled',
          prompt: '一只红苹果',
          createdAt: 1,
          updatedAt: 3,
          error: '生成任务已取消',
          errorCode: 'canceled',
        })
      )

    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()

    const controller = new AbortController()
    const promise = generateImage(
      {
        prompt: '一只红苹果',
        preferredProviders: ['1024token', 'custom'],
      },
      { signal: controller.signal }
    )

    await Promise.resolve()
    controller.abort()
    await Promise.resolve()

    await expect(promise).rejects.toMatchObject({
      name: 'AbortError',
    })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[2][0]).toBe('/api/generate/jobs/job-2')
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      method: 'DELETE',
    })
  })
})
