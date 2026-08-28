# AWS Lambda Python base image (container packaging for ffmpeg + yt-dlp)
FROM public.ecr.aws/lambda/python:3.12

# Install a static ffmpeg build matched to the image architecture
RUN dnf install -y tar xz wget \
  && ARCH="$(uname -m)" \
  && case "$ARCH" in \
       x86_64) FF_ARCH=amd64 ;; \
       aarch64|arm64) FF_ARCH=arm64 ;; \
       *) echo "Unsupported arch: $ARCH" && exit 1 ;; \
     esac \
  && wget -q "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-${FF_ARCH}-static.tar.xz" -O /tmp/ffmpeg.tar.xz \
  && mkdir -p /tmp/ffmpeg \
  && tar -xJf /tmp/ffmpeg.tar.xz -C /tmp/ffmpeg --strip-components=1 \
  && cp /tmp/ffmpeg/ffmpeg /tmp/ffmpeg/ffprobe /usr/local/bin/ \
  && chmod +x /usr/local/bin/ffmpeg /usr/local/bin/ffprobe \
  && rm -rf /tmp/ffmpeg /tmp/ffmpeg.tar.xz \
  && dnf clean all

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY core.py ${LAMBDA_TASK_ROOT}/
COPY lambda_function.py ${LAMBDA_TASK_ROOT}/

CMD ["lambda_function.handler"]
